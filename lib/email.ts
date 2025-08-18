import { Resend } from 'resend'

// Lazy initialization to avoid build-time issues
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

export async function sendUploadNotification({
  userEmail,
  fileName,
  fileSize,
  folderName,
  uploadTime
}: {
  userEmail: string
  fileName: string
  fileSize: number
  folderName: string
  uploadTime: string
}) {
  try {
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2)

    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // You can change this to your verified domain later
      to: [userEmail],
      subject: `🎥 New Video Uploaded: ${fileName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #333; text-align: center; margin-bottom: 30px;">🎥 Video Upload Complete!</h1>

            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #2d5a2d; margin-top: 0;">Upload Details</h2>
              <p><strong>File Name:</strong> ${fileName}</p>
              <p><strong>File Size:</strong> ${fileSizeMB} MB</p>
              <p><strong>Folder:</strong> ${folderName}</p>
              <p><strong>Upload Time:</strong> ${uploadTime}</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">Your video has been successfully uploaded and is now available in your drive.</p>
            </div>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log(`Email notification sent successfully to ${userEmail}`)
    return { success: true, data }

  } catch (error) {
    console.error('Failed to send email notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
