import { ElasticEmail } from '@elasticemail/elasticemail-client'

// Access the API key properly for server-side usage
const apiKey = process.env.ELASTIC_EMAIL_API_KEY
if (!apiKey) {
  throw new Error('ELASTIC_EMAIL_API_KEY environment variable is not set')
}

const elasticEmail = new ElasticEmail(apiKey)

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

    const emailData = {
      Recipients: {
        To: [userEmail]
      },
      Content: {
        From: 'your-email@gmail.com', // You'll need to verify this email in Elastic Email
        Subject: `🎥 New Video Uploaded: ${fileName}`,
        Body: [
          {
            ContentType: 'Html',
            Content: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">🎥 New Video Uploaded!</h1>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px;">
                  <h2 style="color: #333; margin-top: 0;">Video Details</h2>

                  <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
                    <p style="margin: 5px 0;"><strong>📁 File Name:</strong> ${fileName}</p>
                    <p style="margin: 5px 0;"><strong>📊 File Size:</strong> ${fileSizeMB} MB</p>
                    <p style="margin: 5px 0;"><strong>📂 Destination Folder:</strong> ${folderName}</p>
                    <p style="margin: 5px 0;"><strong>⏰ Upload Time:</strong> ${uploadTime}</p>
                  </div>

                  <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <p style="margin: 0; color: #155724;">
                      ✅ Your video has been successfully uploaded to Google Drive and is now available in your "${folderName}" folder.
                    </p>
                  </div>

                  <div style="margin-top: 20px; padding: 15px; background: #f1f3f4; border-radius: 8px;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      💡 <strong>Tip:</strong> You can view and manage all your videos directly in Google Drive.
                    </p>
                  </div>
                </div>

                <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                  <p>This is an automated notification from your Video Upload System</p>
                </div>
              </div>
            `
          }
        ]
      }
    }

    const response = await elasticEmail.emails.emailsTransactionalPost(emailData)
    console.log('Upload notification email sent successfully:', response)
    return { success: true, data: response }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}
