import { supabase } from './auth'
import { getSelectedFolder } from './drive'

export async function createOrGetUploadLink() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get user's selected folder
    const selectedFolder = await getSelectedFolder()
    if (!selectedFolder) {
      throw new Error('No Google Drive folder selected. Please select a folder first.')
    }

    // Get the user's current session to access their Google access token
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.provider_token

    if (!accessToken) {
      throw new Error('No Google access token available. Please sign in with Google again.')
    }

    // Check if user already has an upload link
    const { data: existingLink } = await supabase
      .from('permanent_upload_links')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingLink) {
      // Update existing link with new folder and token
      const { data, error } = await supabase
        .from('permanent_upload_links')
        .update({
          folder_id: selectedFolder.folder_id,
          folder_name: selectedFolder.folder_name,
          google_access_token: accessToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLink.id)
        .select()
        .single()

      if (error) throw error

      return {
        upload_token: data.upload_token,
        upload_url: `${window.location.origin}/upload/${data.upload_token}`,
        folder_name: data.folder_name
      }
    } else {
      // Create new upload link
      const uploadToken = generateToken()

      const { data, error } = await supabase
        .from('permanent_upload_links')
        .insert({
          user_id: user.id,
          upload_token: uploadToken,
          folder_id: selectedFolder.folder_id,
          folder_name: selectedFolder.folder_name,
          google_access_token: accessToken
        })
        .select()
        .single()

      if (error) throw error

      return {
        upload_token: data.upload_token,
        upload_url: `${window.location.origin}/upload/${data.upload_token}`,
        folder_name: data.folder_name
      }
    }
  } catch (error) {
    console.error('Error creating/getting upload link:', error)
    throw error
  }
}

export async function getUploadLink(uploadToken: string) {
  try {
    const { data, error } = await supabase
      .from('permanent_upload_links')
      .select('*')
      .eq('upload_token', uploadToken)
      .eq('is_active', true)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting upload link:', error)
    throw error
  }
}

export async function getUserUploadLink() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('permanent_upload_links')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting user upload link:', error)
    return null
  }
}

export async function deactivateUploadLink() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('permanent_upload_links')
      .update({ is_active: false })
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deactivating upload link:', error)
    throw error
  }
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
