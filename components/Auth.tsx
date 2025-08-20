'use client'

import { useState, useEffect } from 'react'
import { signInWithGoogle, signOut, getCurrentUser } from '@/lib/auth'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function Auth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getCurrentUser().then(user => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="">
      {user ? (
        <Button variant='outline' onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      ) : (
        <button
          onClick={handleSignIn}
          className="bg-neutral-900 text-white px-4 mt-2 py-4 rounded-xl"
        >
          Sign in with Google
        </button>
      )}
    </div>
  )
}
