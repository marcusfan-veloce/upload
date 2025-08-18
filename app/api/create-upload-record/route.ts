import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUploadLink } from '@/lib/upload-links'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const fileName = formData.get('fileName') as string
    const fileSize = formData.get('fileSize') as string
    const fileType = formData.get('fileType') as string
    const uploadToken = formData.get('uploadToken') as string

    if (!fileName || !fileSize || !fileType || !uploadToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate the upload token
    const uploadLink = await getUploadLink(uploadToken)
    if (!uploadLink) {
      return NextResponse.json(
        { error: 'Invalid or inactive upload link' },
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
        file_name: fileName,
        file_size: parseInt(fileSize),
        file_type: fileType,
        status: 'processing'
      })
      .select()
      .single()

    if (uploadError) {
      throw uploadError
    }

    return NextResponse.json({
      success: true,
      message: 'Upload record created successfully',
      uploadId: uploadRecord.id
    })

  } catch (error) {
    console.error('Create upload record error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
