'use client'

import { useState, useEffect } from 'react'
import { createOrGetUploadLink, getUserUploadLink, deactivateUploadLink } from '@/lib/upload-links'

interface UploadLink {
  id: string
  upload_token: string
  folder_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function UploadLinkManager() {
  const [uploadLink, setUploadLink] = useState<UploadLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUploadLink()
  }, [])

  const loadUploadLink = async () => {
    try {
      setLoading(true)
      setError(null)
      const link = await getUserUploadLink()
      setUploadLink(link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load upload link')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    try {
      setCreating(true)
      setError(null)
      const link = await createOrGetUploadLink()
      await loadUploadLink() // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create upload link')
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivateLink = async () => {
    try {
      await deactivateUploadLink()
      await loadUploadLink() // Refresh the data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate link')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Link</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Link</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!uploadLink ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No upload link created yet.</p>
          <button
            onClick={handleCreateLink}
            disabled={creating}
            className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Upload Link'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Your Upload Link</h3>
            <p className="text-sm text-green-700 mb-2">Share this link with anyone to upload videos:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={`${window.location.origin}/upload/${uploadLink.upload_token}`}
                readOnly
                className="flex-1 p-2 border rounded text-sm bg-white"
              />
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/upload/${uploadLink.upload_token}`)}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-sm text-green-600 mt-2">
              Folder: {uploadLink.folder_name}
            </p>
            <p className="text-xs text-green-600">
              Status: {uploadLink.is_active ? 'Active' : 'Inactive'}
            </p>
          </div>

          <div className="flex gap-2">
            {uploadLink.is_active ? (
              <button
                onClick={handleDeactivateLink}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Deactivate Link
              </button>
            ) : (
              <button
                onClick={handleCreateLink}
                disabled={creating}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                Reactivate Link
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            <p>Created: {new Date(uploadLink.created_at).toLocaleString()}</p>
            <p>Updated: {new Date(uploadLink.updated_at).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  )
}
