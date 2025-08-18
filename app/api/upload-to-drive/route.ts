import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUploadLink } from '@/lib/upload-links'
import { sendUploadNotification } from '@/lib/email'

// Use Edge Runtime for larger payloads
export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadToken = formData.get('uploadToken') as string

    if (!file || !uploadToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate the upload token and get the stored Google access token
    const uploadLink = await getUploadLink(uploadToken)
    if (!uploadLink) {
      return NextResponse.json(
        { error: 'Invalid or inactive upload link' },
        { status: 401 }
      )
    }

    if (!uploadLink.google_access_token) {
      console.error('No Google access token found for upload link:', uploadToken)
      return NextResponse.json(
        { error: 'No Google access token available for this link. Please recreate the upload link.' },
        { status: 401 }
      )
    }

    // Get the Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the user's email for the notification
    const { data: { user } } = await supabase.auth.admin.getUserById(uploadLink.user_id)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create upload record
    const { data: uploadRecord, error: uploadError } = await supabase
      .from('uploads')
      .insert({
        upload_link_id: uploadLink.id,
        user_id: uploadLink.user_id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        status: 'processing'
      })
      .select()
      .single()

    if (uploadError) {
      throw uploadError
    }

    try {
      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const fileBuffer = Buffer.from(bytes)

      // Upload directly to Google Drive using the stored access token
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${uploadLink.google_access_token}`,
            'Content-Type': 'multipart/related; boundary=foo_bar_baz',
          },
          body: createMultipartBody(file.name, fileBuffer, file.type, uploadLink.folder_id)
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Google Drive upload failed:', response.status, errorData)
        throw new Error(`Google Drive upload failed: ${response.status}`)
      }

      const driveResponse = await response.json()
      console.log('File uploaded to Google Drive:', file.name, 'File ID:', driveResponse.id)

      // Update status to completed
      await supabase
        .from('uploads')
        .update({
          status: 'completed',
          google_drive_file_id: driveResponse.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', uploadRecord.id)

      // Send email notification
      const uploadTime = new Date().toLocaleString()
      await sendUploadNotification({
        userEmail: user.email!,
        fileName: file.name,
        fileSize: file.size,
        folderName: uploadLink.folder_name,
        uploadTime: uploadTime
      })

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully to Google Drive',
        uploadId: uploadRecord.id,
        googleDriveFileId: driveResponse.id
      })

    } catch (uploadError) {
      console.error('Upload to Google Drive error:', uploadError)

      // Update status to failed
      await supabase
        .from('uploads')
        .update({ status: 'failed' })
        .eq('id', uploadRecord.id)

      throw uploadError
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to create multipart body for Google Drive API
function createMultipartBody(fileName: string, fileBuffer: Buffer, mimeType: string, folderId: string): string {
  const boundary = 'foo_bar_baz'
  const metadata = {
    name: fileName,
    parents: [folderId]
  }

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    '',
    fileBuffer.toString('base64'),
    `--${boundary}--`
  ].join('\r\n')

  return body
}
