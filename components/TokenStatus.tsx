'use client'
import { useEffect, useState } from 'react'
import { checkUserTokenStatus, getTokenStatusMessage, TokenStatus } from '@/lib/token-manager'
import { supabase } from '@/lib/auth'
import { CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react'

export default function TokenStatus() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUserAndStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          const status = await checkUserTokenStatus(user.id)
          setTokenStatus(status)
        }
      } catch (error) {
        console.error('Error getting user or token status:', error)
      } finally {
        setLoading(false)
      }
    }

    getUserAndStatus()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!user || !tokenStatus) {
    return null
  }

  const getStatusIcon = () => {
    if (tokenStatus.needsRefresh) {
      return <RefreshCw className="h-5 w-5 text-yellow-500" />
    }
    if (tokenStatus.isValid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <AlertCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusColor = () => {
    if (tokenStatus.needsRefresh) {
      return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    }
    if (tokenStatus.isValid) {
      return 'text-green-700 bg-green-50 border-green-200'
    }
    return 'text-red-700 bg-red-50 border-red-200'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Google OAuth Token Status
        </h3>
        {getStatusIcon()}
      </div>

      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-4 w-4" />
          <span className="font-medium">
            {getTokenStatusMessage(tokenStatus)}
          </span>
        </div>

        {tokenStatus.expiresAt && (
          <p className="text-sm opacity-75">
            Expires: {tokenStatus.expiresAt.toLocaleString()}
          </p>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Automatic Token Refresh</h4>
        <p className="text-sm text-blue-700">
          Your upload links now automatically refresh Google OAuth tokens when they expire.
          Users won't need to manually sign in again unless they change their Google password
          or revoke access to the app.
        </p>
      </div>

      {tokenStatus.needsRefresh && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Token Refresh Needed</h4>
          <p className="text-sm text-yellow-700">
            Your current token will be automatically refreshed when you next use an upload link.
            No action required from you.
          </p>
        </div>
      )}
    </div>
  )
}
