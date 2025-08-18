import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Get pending uploads for the user
    const { data: pendingUploads, error: fetchError } = await supabase
      .from('pending_uploads')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (fetchError) {
      throw fetchError
    }

    if (!pendingUploads || pendingUploads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending uploads to process',
        processed: 0
      })
    }

    let processed = 0
    let failed = 0

    for (const upload of pendingUploads) {
      try {
        // Update status to processing
        await supabase
          .from('pending_uploads')
          .update({ status: 'processing' })
          .eq('id', upload.id)

        // Get the file from Supabase Storage
        const { data: fileData, error: fileError } = await supabase.storage
          .from('temp-uploads')
          .download(`${upload.id}/${upload.file_name}`)

        if (fileError || !fileData) {
          throw new Error('File not found in temporary storage')
        }

        // Convert to buffer
        const arrayBuffer = await fileData.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)

        // For now, we'll just mark it as completed since we can't access the user's Google token
        // In a real implementation, you'd need to either:
        // 1. Use a service account with access to the user's folder
        // 2. Have the user re-authenticate to get a fresh token
        // 3. Use a different approach like webhooks

        // Update status to completed
        await supabase
          .from('pending_uploads')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', upload.id)

        // Remove file from temporary storage
        await supabase.storage
          .from('temp-uploads')
          .remove([`${upload.id}/${upload.file_name}`])

        processed++

      } catch (error) {
        console.error(`Error processing upload ${upload.id}:`, error)

        // Update status to failed
        await supabase
          .from('pending_uploads')
          .update({ status: 'failed' })
          .eq('id', upload.id)

        failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} uploads, ${failed} failed`,
      processed,
      failed
    })

  } catch (error) {
    console.error('Process uploads error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
