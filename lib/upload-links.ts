import { supabase } from './auth'
import { getSelectedFolder } from './drive'

// Token management functions
async function refreshGoogleToken(refreshToken: string) {
  try {
    console.log('Attempting to refresh Google token...')

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token refresh failed:', response.status, errorText)
      throw new Error(`Token refresh failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Token refresh successful, new expiry:', data.expires_in, 'seconds')

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    }
  } catch (error) {
    console.error('Error refreshing Google token:', error)
    throw error
  }
}

async function ensureValidToken(uploadRecord: any) {
  try {
    console.log('Checking token validity for upload record:', uploadRecord.id)
    console.log('Current token expires at:', uploadRecord.token_expires_at)

    // Check if token is expired (with 5 minute buffer)
    const now = Date.now()
    const expiresAt = new Date(uploadRecord.token_expires_at).getTime()
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds

    console.log('Current time:', new Date(now).toISOString())
    console.log('Token expires at:', new Date(expiresAt).toISOString())
    console.log('Buffer time (ms):', bufferTime)
    console.log('Time until expiry (ms):', expiresAt - now)
    console.log('Needs refresh:', (expiresAt - now) <= bufferTime)

    if (now < (expiresAt - bufferTime)) {
      console.log('Token is still valid, returning existing token')
      return uploadRecord.google_access_token
    }

    // Token is expired or close to expiring, refresh it
    if (!uploadRecord.google_refresh_token) {
      console.error('No refresh token available for upload record:', uploadRecord.id)
      throw new Error('No refresh token available')
    }

    console.log('Refreshing expired Google access token via API...')

    // Use the server-side API endpoint for token refresh
    const refreshResponse = await fetch('/api/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: uploadRecord.google_refresh_token,
        uploadRecordId: uploadRecord.id
      })
    })

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.json()
      console.error('Token refresh API failed:', errorData)
      throw new Error(`Token refresh failed: ${errorData.error}`)
    }

    const refreshData = await refreshResponse.json()
    console.log('Token refresh successful via API, new expiry:', refreshData.expires_at)

    // Return the new access token (database is already updated by the API)
    return refreshData.access_token
  } catch (error) {
    console.error('Error ensuring valid token:', error)
    throw error
  }
}

export async function createOrGetUploadLink() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get user's selected folder
    const selectedFolder = await getSelectedFolder()
    if (!selectedFolder) {
      throw new Error('No Google Drive folder selected. Please select a folder first.')
    }

    // Get the user's current session to access their Google tokens
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.provider_token
    const refreshToken = session?.provider_refresh_token

    if (!accessToken) {
      throw new Error('No Google access token available. Please sign in with Google again.')
    }

    // Calculate token expiry (Google tokens typically last 1 hour)
    const tokenExpiresAt = new Date(Date.now() + (3600 * 1000)).toISOString()

    // Check if user already has an upload link
    const { data: existingLink } = await supabase
      .from('permanent_upload_links')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingLink) {
      // Update existing link with new folder and tokens
      const { data, error } = await supabase
        .from('permanent_upload_links')
        .update({
          folder_id: selectedFolder.folder_id,
          folder_name: selectedFolder.folder_name,
          google_access_token: accessToken,
          google_refresh_token: refreshToken,
          token_expires_at: tokenExpiresAt,
          is_active: true, // Make sure to reactivate the link
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
          google_access_token: accessToken,
          google_refresh_token: refreshToken,
          token_expires_at: tokenExpiresAt
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

export async function getUploadLinkWithValidToken(uploadToken: string) {
  try {
    const uploadRecord = await getUploadLink(uploadToken)
    if (!uploadRecord) {
      throw new Error('Upload link not found')
    }

    // Ensure the token is valid and refresh if necessary
    const validToken = await ensureValidToken(uploadRecord)

    // Return the record with the valid token
    return {
      ...uploadRecord,
      google_access_token: validToken
    }
  } catch (error) {
    console.error('Error getting upload link with valid token:', error)
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
