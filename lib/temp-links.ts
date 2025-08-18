import { supabase } from './auth'
import { getSelectedFolder } from './drive'

export async function createTemporaryLink() {
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

    // Generate a unique token
    const token = generateToken()

    // Create temporary link record with the Google access token
    const { data, error } = await supabase
      .from('temporary_links')
      .insert({
        user_id: user.id,
        token: token,
        folder_id: selectedFolder.folder_id,
        folder_name: selectedFolder.folder_name,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        is_active: true,
        google_access_token: accessToken // Store the access token
      })
      .select()
      .single()

    if (error) throw error

    return {
      token: token,
      upload_url: `${window.location.origin}/upload/${token}`,
      expires_at: data.expires_at
    }
  } catch (error) {
    console.error('Error creating temporary link:', error)
    throw error
  }
}

export async function getTemporaryLink(token: string) {
  try {
    const { data, error } = await supabase
      .from('temporary_links')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (error) throw error

    // Check if link is expired
    if (new Date(data.expires_at) < new Date()) {
      throw new Error('Link has expired')
    }

    return data
  } catch (error) {
    console.error('Error getting temporary link:', error)
    throw error
  }
}

export async function getUserTemporaryLinks() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('temporary_links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting user temporary links:', error)
    throw error
  }
}

export async function deactivateLink(token: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('temporary_links')
      .update({ is_active: false })
      .eq('token', token)
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error deactivating link:', error)
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
