import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendUploadNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { uploadId, googleDriveFileId } = await request.json()

    if (!uploadId || !googleDriveFileId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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

    // Get the upload record
    const { data: uploadRecord, error: fetchError } = await supabase
      .from('uploads')
      .select('*, permanent_upload_links(folder_name)')
      .eq('id', uploadId)
      .single()

    if (fetchError || !uploadRecord) {
      return NextResponse.json(
        { error: 'Upload record not found' },
        { status: 404 }
      )
    }

    // Update status to completed
    const { error: updateError } = await supabase
      .from('uploads')
      .update({
        status: 'completed',
        google_drive_file_id: googleDriveFileId,
        updated_at: new Date().toISOString()
      })
      .eq('id', uploadId)

    if (updateError) {
      throw updateError
    }

    // Get the user's email for the notification
    const { data: { user } } = await supabase.auth.admin.getUserById(uploadRecord.user_id)
    if (user) {
      // Send email notification
      const uploadTime = new Date().toLocaleString()
      await sendUploadNotification({
        userEmail: user.email!,
        fileName: uploadRecord.file_name,
        fileSize: uploadRecord.file_size,
        folderName: uploadRecord.permanent_upload_links.folder_name,
        uploadTime: uploadTime
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Upload marked as completed'
    })

  } catch (error) {
    console.error('Complete upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
