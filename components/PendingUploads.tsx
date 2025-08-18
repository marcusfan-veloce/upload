'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/auth'

interface PendingUpload {
  id: string
  file_name: string
  file_size: number
  file_type: string
  status: string
  created_at: string
  folder_name: string
}

export default function PendingUploads() {
  const [uploads, setUploads] = useState<PendingUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPendingUploads()
  }, [])

  const loadPendingUploads = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('pending_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUploads(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load uploads')
    } finally {
      setLoading(false)
    }
  }

  const moveToGoogleDrive = async (uploadId: string) => {
    try {
      setProcessing(uploadId)
      setError(null)

      // Get the current user's session to access their Google token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.provider_token) {
        throw new Error('No Google access token available. Please sign in again.')
      }

      // Get the upload record
      const { data: upload, error: fetchError } = await supabase
        .from('pending_uploads')
        .select('*')
        .eq('id', uploadId)
        .single()

      if (fetchError || !upload) {
        throw new Error('Upload record not found')
      }

      // Get the file from Supabase Storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('temp-uploads')
        .download(`${uploadId}/${upload.file_name}`)

      if (fileError || !fileData) {
        throw new Error('File not found in temporary storage')
      }

      // Convert to buffer
      const arrayBuffer = await fileData.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)

      // Upload to Google Drive
      const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.provider_token}`,
            'Content-Type': 'multipart/related; boundary=foo_bar_baz',
          },
          body: createMultipartBody(upload.file_name, fileBuffer, upload.file_type, upload.folder_id)
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Google Drive upload failed: ${response.status}`)
      }

      const driveResponse = await response.json()
      console.log('File uploaded to Google Drive:', upload.file_name, 'File ID:', driveResponse.id)

      // Update status to completed
      const { error: updateError } = await supabase
        .from('pending_uploads')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', uploadId)

      if (updateError) {
        console.error('Error updating status:', updateError)
      }

      // Remove file from temporary storage
      await supabase.storage
        .from('temp-uploads')
        .remove([`${uploadId}/${upload.file_name}`])

      // Refresh the list
      await loadPendingUploads()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move file to Google Drive')

      // Update status to failed
      await supabase
        .from('pending_uploads')
        .update({ status: 'failed' })
        .eq('id', uploadId)
    } finally {
      setProcessing(null)
    }
  }

  const createMultipartBody = (fileName: string, fileBuffer: Buffer, mimeType: string, folderId: string): string => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending_no_storage': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ready to Process'
      case 'pending_no_storage': return 'File Missing'
      case 'processing': return 'Processing'
      case 'completed': return 'Completed'
      case 'failed': return 'Failed'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Uploads</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading uploads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Pending Uploads</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {uploads.length === 0 ? (
        <p className="text-gray-600">No pending uploads.</p>
      ) : (
        <div className="space-y-4">
          {uploads.map((upload) => (
            <div key={upload.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{upload.file_name}</h3>
                  <p className="text-sm text-gray-600">
                    Size: {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-sm text-gray-600">
                    Folder: {upload.folder_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Uploaded: {new Date(upload.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(upload.status)}`}>
                    {getStatusText(upload.status)}
                  </span>

                  {upload.status === 'pending' && (
                    <button
                      onClick={() => moveToGoogleDrive(upload.id)}
                      disabled={processing === upload.id}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                      {processing === upload.id ? 'Moving...' : 'Move to Drive'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
