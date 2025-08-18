// Gmail API implementation using existing user's access token (edge runtime compatible)

export async function sendUploadNotification({
  userEmail,
  fileName,
  fileSize,
  folderName,
  uploadTime,
  googleAccessToken // Add this parameter
}: {
  userEmail: string
  fileName: string
  fileSize: number
  folderName: string
  uploadTime: string
  googleAccessToken: string // Add this parameter
}) {
  try {
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2)

    // Check if we have the required parameters
    if (!googleAccessToken) {
      console.log('No Google access token provided, logging email details instead:', {
        to: userEmail,
        subject: `🎥 New Video Uploaded: ${fileName}`,
        fileName,
        fileSizeMB,
        folderName,
        uploadTime
      })
      return {
        success: false,
        error: 'No Google access token provided for sending email'
      }
    }

    // Create email content
    const emailContent = `
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

    // Get the user's email from the access token (this will be the "from" email)
    // We'll use the userEmail as both "to" and "from" since it's the same person
    const fromEmail = userEmail

    // Encode email content for Gmail API
    const encodedEmail = btoa(
      `From: ${fromEmail}\r\n` +
      `To: ${userEmail}\r\n` +
      `Subject: 🎥 New Video Uploaded: ${fileName}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/html; charset=utf-8\r\n` +
      `\r\n` +
      emailContent
    ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    // Send email via Gmail API using the user's access token
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Gmail API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    console.log(`Email notification sent successfully to ${userEmail}`)
    return { success: true }

  } catch (error) {
    console.error('Failed to send email notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
