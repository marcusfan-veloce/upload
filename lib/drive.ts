import { supabase } from './auth'

// Google Drive API functions
export async function getGoogleDriveFolders() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get the access token from Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.provider_token

    if (!accessToken) {
      throw new Error('No Google access token available')
    }

    // Fetch folders from Google Drive
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.folder"&fields=files(id,name,parents)',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch Google Drive folders')
    }

    const data = await response.json()
    return data.files || []
  } catch (error) {
    console.error('Error fetching Google Drive folders:', error)
    throw error
  }
}

export async function saveSelectedFolder(folderId: string, folderName: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Save to Supabase
    const { error } = await supabase
      .from('user_folders')
      .upsert({
        user_id: user.id,
        folder_id: folderId,
        folder_name: folderName,
        created_at: new Date().toISOString()
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error saving selected folder:', error)
    throw error
  }
}

export async function getSelectedFolder() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_folders')
      .select('folder_id, folder_name')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting selected folder:', error)
    return null
  }
}
