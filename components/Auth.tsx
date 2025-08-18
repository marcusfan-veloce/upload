'use client'

import { useState, useEffect } from 'react'
import { signInWithGoogle, signOut, getCurrentUser } from '@/lib/auth'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function Auth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
        <ProfileButton />
      ) : (
        <button
          onClick={handleSignIn}
          className="bg-blue-500 text-white px-2 py-1 rounded-xl"
        >
          Sign in with Google
        </button>
      )}
    </div>
  )
}

function ProfileButton() {
  const router = useRouter()
  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">My Account</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='bg-white/20 w-30 rounded-xl box-border p-2 space-y-2 mt-2'>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
