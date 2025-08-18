# Fixing Google OAuth Provider Token Issue

## Problem
You're getting "no provider token available" because the Google OAuth isn't configured with the right scopes for Google Drive access.

## Solution

### Step 1: Update Supabase Google OAuth Configuration

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Providers** → **Google**
3. In the **Scopes** field, add these scopes:
   ```
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   https://www.googleapis.com/auth/drive.file
   https://www.googleapis.com/auth/drive.readonly
   ```
4. **Save** the configuration

### Step 2: Update Google Cloud Console

1. Go to **Google Cloud Console**
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Make sure these scopes are added:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive.readonly`

### Step 3: Re-authenticate

1. **Sign out** of your application
2. **Sign back in** with Google
3. You should now see "Provider Token: Available" in the debug component

## Alternative: Manual Scope Update

If the above doesn't work, you can also update the scopes directly in your Supabase database:

```sql
UPDATE auth.providers
SET scopes = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly'
WHERE provider = 'google';
```

## Testing

After making these changes:
1. Sign out and sign back in
2. Check the AuthDebug component - it should show "Provider Token: Available"
3. Try creating a temporary link and uploading a file

## Common Issues

- **"Invalid scope" error**: Make sure all scopes are valid Google API scopes
- **"Consent screen" error**: Update your Google Cloud Console OAuth consent screen
- **Token still missing**: Clear browser cookies and sign in again
