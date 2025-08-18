'use client'

import { useState, useEffect } from 'react'
import { getGoogleDriveFolders, saveSelectedFolder, getSelectedFolder } from '@/lib/drive'

interface Folder {
  id: string
  name: string
}

export default function FolderSelector() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFoldersAndSelection()
  }, [])

  const loadFoldersAndSelection = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load user's previously selected folder
      const savedFolder = await getSelectedFolder()
      if (savedFolder) {
        setSelectedFolder({
          id: savedFolder.folder_id,
          name: savedFolder.folder_name
        })
      }

      // Load all available folders
      const availableFolders = await getGoogleDriveFolders()
      setFolders(availableFolders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  const handleFolderSelect = async (folder: Folder) => {
    try {
      setSaving(true)
      setError(null)

      await saveSelectedFolder(folder.id, folder.name)
      setSelectedFolder(folder)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save folder selection')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Google Drive Folder</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading folders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Google Drive Folder</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 mb-2">Error: {error}</p>
          <button
            onClick={loadFoldersAndSelection}
            className="text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Google Drive Folder</h2>

      {selectedFolder ? (
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Selected folder:</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-medium text-green-800">{selectedFolder.name}</p>
            <p className="text-xs text-green-600">ID: {selectedFolder.id}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 mb-4">No folder selected yet.</p>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => handleFolderSelect(folder)}
            disabled={saving}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selectedFolder?.id === folder.id
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <p className="font-medium">{folder.name}</p>
            <p className="text-xs text-gray-500">ID: {folder.id}</p>
          </button>
        ))}
      </div>

      {saving && (
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-1">Saving selection...</p>
        </div>
      )}
    </div>
  )
}
