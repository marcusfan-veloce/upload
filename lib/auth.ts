import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent', // This forces new consent every time
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.send'
      },
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) throw error
  return data
}

// Force re-authentication to get fresh tokens with new scopes
export async function forceReAuthWithGoogle() {
  // First sign out to clear existing tokens
  await signOut()

  // Then sign in again with forced consent
  return signInWithGoogle()
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  window.location.href = '/'
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export { supabase }
