'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

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

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    try {
      // TODO: Implement actual upload logic
      console.log('Uploading files:', files)
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Upload complete!')
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
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
