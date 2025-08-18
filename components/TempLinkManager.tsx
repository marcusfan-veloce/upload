'use client'

import { useState, useEffect } from 'react'
import { createTemporaryLink, getUserTemporaryLinks, deactivateLink } from '@/lib/temp-links'

interface TempLink {
  id: string
  token: string
  folder_name: string
  created_at: string
  expires_at: string
  is_active: boolean
}

export default function TempLinkManager() {
  const [links, setLinks] = useState<TempLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newLink, setNewLink] = useState<{ token: string; upload_url: string; expires_at: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    try {
      setLoading(true)
      setError(null)
      const userLinks = await getUserTemporaryLinks()
      setLinks(userLinks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load links')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLink = async () => {
    try {
      setCreating(true)
      setError(null)
      const link = await createTemporaryLink()
      setNewLink(link)
      await loadLinks() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link')
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivateLink = async (token: string) => {
    try {
      await deactivateLink(token)
      await loadLinks() // Refresh the list
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
        <h2 className="text-xl font-semibold mb-4">Temporary Upload Links</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading links...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Temporary Upload Links</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {newLink && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-green-800 mb-2">New Link Created!</h3>
          <p className="text-sm text-green-700 mb-2">Share this link with your client:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newLink.upload_url}
              readOnly
              className="flex-1 p-2 border rounded text-sm bg-white"
            />
            <button
              onClick={() => copyToClipboard(newLink.upload_url)}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Expires: {new Date(newLink.expires_at).toLocaleString()}
          </p>
        </div>
      )}

      <button
        onClick={handleCreateLink}
        disabled={creating}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed mb-6"
      >
        {creating ? 'Creating Link...' : 'Create New Upload Link'}
      </button>

      <div className="space-y-3">
        <h3 className="font-semibold">Your Links:</h3>
        {links.length === 0 ? (
          <p className="text-gray-600">No links created yet.</p>
        ) : (
          links.map((link) => (
            <div key={link.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">Folder: {link.folder_name}</p>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(link.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expires: {new Date(link.expires_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: {link.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                {link.is_active && (
                  <button
                    onClick={() => handleDeactivateLink(link.token)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
