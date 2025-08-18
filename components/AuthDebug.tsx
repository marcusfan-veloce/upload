'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/auth'

export default function AuthDebug() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return <div>Loading auth info...</div>
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-yellow-800 mb-2">Auth Debug Info</h3>

      {session ? (
        <div className="space-y-2 text-sm">
          <p><strong>User:</strong> {session.user.email}</p>
          <p><strong>Provider Token:</strong> {session.provider_token ? 'Available' : 'Missing'}</p>
          <p><strong>Access Token:</strong> {session.access_token ? 'Available' : 'Missing'}</p>
          <p><strong>Refresh Token:</strong> {session.refresh_token ? 'Available' : 'Missing'}</p>

          {session.provider_token && (
            <div className="mt-2">
              <p className="text-xs text-gray-600">Token preview: {session.provider_token.substring(0, 20)}...</p>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Sign Out & Re-authenticate
          </button>
        </div>
      ) : (
        <p className="text-yellow-700">Not authenticated</p>
      )}
    </div>
  )
}
