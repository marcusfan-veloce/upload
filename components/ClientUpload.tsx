'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { getUploadLink } from '@/lib/upload-links'

interface ClientUploadProps {
  token: string
}

export default function ClientUpload({ token }: ClientUploadProps) {
  const [uploadLink, setUploadLink] = useState<any>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      setLoading(true)
      setError(null)
      const link = await getUploadLink(token)
      setUploadLink(link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or inactive link')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    multiple: false
  })

  const uploadDirectlyToGoogleDrive = async (file: File) => {
    try {
      // First, create a record in our system via API (metadata only)
      const formData = new FormData()
      formData.append('fileName', file.name)
      formData.append('fileSize', file.size.toString())
      formData.append('fileType', file.type)
      formData.append('uploadToken', token)

      const response = await fetch('/api/create-upload-record', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create upload record')
      }

      const result = await response.json()

      // Now upload directly to Google Drive using the stored access token
      const fileBuffer = await file.arrayBuffer()

      const driveResponse = await fetch(
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

      if (!driveResponse.ok) {
        throw new Error(`Google Drive upload failed: ${driveResponse.status}`)
      }

      const driveResult = await driveResponse.json()

      // Update the record to completed
      await fetch('/api/complete-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: result.uploadId,
          googleDriveFileId: driveResult.id
        })
      })

      return { success: true, googleDriveFileId: driveResult.id }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const createMultipartBody = (fileName: string, fileBuffer: ArrayBuffer, mimeType: string, folderId: string): string => {
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
      Buffer.from(fileBuffer).toString('base64'),
      `--${boundary}--`
    ].join('\r\n')

    return body
  }

  const handleUpload = async () => {
    if (files.length === 0 || !uploadLink) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress((i / files.length) * 100)

        await uploadDirectlyToGoogleDrive(file)
      }

      setUploadProgress(100)
      setFiles([])
      alert('Upload completed successfully! Your file has been uploaded to Google Drive.')
    } catch (error) {
      console.error('Upload failed:', error)
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Validating upload link...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Upload Link Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            Please contact the person who sent you this link for a new one.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-1">Uploading to:</h3>
        <p className="text-blue-700">{uploadLink.folder_name}</p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-600">Drop the video here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">Drag & drop a video here, or click to select</p>
            <p className="text-sm text-gray-500">Supports: MP4, MOV, AVI, MKV, WebM</p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Selected file:</h3>
          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-sm">{files[0].name}</p>
            <p className="text-xs text-gray-500">
              {(files[0].size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      )}
    </div>
  )
}
