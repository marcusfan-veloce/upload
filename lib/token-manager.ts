import { supabase } from './auth'

export interface TokenStatus {
  isValid: boolean
  expiresAt: Date | null
  timeUntilExpiry: number | null // milliseconds
  needsRefresh: boolean
}

export interface RefreshResult {
  success: boolean
  newAccessToken?: string
  newExpiresAt?: Date
  error?: string
}

/**
 * Check the status of a Google access token
 */
export function checkTokenStatus(expiresAt: string | null): TokenStatus {
  if (!expiresAt) {
    return {
      isValid: false,
      expiresAt: null,
      timeUntilExpiry: null,
      needsRefresh: true
    }
  }

  const expiryTime = new Date(expiresAt).getTime()
  const now = Date.now()
  const timeUntilExpiry = expiryTime - now
  const bufferTime = 5 * 60 * 1000 // 5 minutes buffer

  return {
    isValid: timeUntilExpiry > 0,
    expiresAt: new Date(expiresAt),
    timeUntilExpiry,
    needsRefresh: timeUntilExpiry <= bufferTime
  }
}

/**
 * Get a human-readable message about token status
 */
export function getTokenStatusMessage(status: TokenStatus): string {
  if (!status.expiresAt) {
    return 'No token expiry information available'
  }

  if (status.needsRefresh) {
    return 'Token needs refresh'
  }

  if (status.timeUntilExpiry) {
    const minutes = Math.floor(status.timeUntilExpiry / (1000 * 60))
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `Token valid for ${hours} hour${hours > 1 ? 's' : ''}`
    } else if (minutes > 0) {
      return `Token valid for ${minutes} minute${minutes > 1 ? 's' : ''}`
    } else {
      return 'Token expires soon'
    }
  }

  return 'Token status unknown'
}

/**
 * Check if a user's upload link has valid tokens
 */
export async function checkUserTokenStatus(userId: string): Promise<TokenStatus | null> {
  try {
    const { data, error } = await supabase
      .from('permanent_upload_links')
      .select('token_expires_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return checkTokenStatus(data.token_expires_at)
  } catch (error) {
    console.error('Error checking user token status:', error)
    return null
  }
}

/**
 * Get a summary of all upload links and their token status
 */
export async function getAllTokenStatuses(): Promise<Array<{
  userId: string
  uploadToken: string
  status: TokenStatus
  folderName: string
}>> {
  try {
    const { data, error } = await supabase
      .from('permanent_upload_links')
      .select('user_id, upload_token, token_expires_at, folder_name')
      .eq('is_active', true)

    if (error) throw error

    return data.map(link => ({
      userId: link.user_id,
      uploadToken: link.upload_token,
      status: checkTokenStatus(link.token_expires_at),
      folderName: link.folder_name
    }))
  } catch (error) {
    console.error('Error getting all token statuses:', error)
    return []
  }
}
