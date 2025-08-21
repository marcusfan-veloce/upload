import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { refreshToken, uploadRecordId } = await request.json()

    if (!refreshToken || !uploadRecordId) {
      return NextResponse.json(
        { error: 'Missing refresh token or upload record ID' },
        { status: 400 }
      )
    }

    console.log('Refreshing token for upload record:', uploadRecordId)

    // Refresh the token using Google's OAuth endpoint
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
      console.error('Google token refresh failed:', response.status, errorText)
      return NextResponse.json(
        {
          error: 'Token refresh failed',
          details: errorText,
          status: response.status
        },
        { status: 400 }
      )
    }

    const tokenData = await response.json()
    console.log('Token refresh successful, new expiry:', tokenData.expires_in, 'seconds')

    // Update the upload record with new tokens
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const newExpiryTime = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()

    const { error: updateError } = await supabase
      .from('permanent_upload_links')
      .update({
        google_access_token: tokenData.access_token,
        token_expires_at: newExpiryTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', uploadRecordId)

    if (updateError) {
      console.error('Error updating tokens in database:', updateError)
      return NextResponse.json(
        { error: 'Failed to update tokens in database' },
        { status: 500 }
      )
    }

    console.log('Successfully updated tokens in database for upload record:', uploadRecordId)

    return NextResponse.json({
      success: true,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      expires_at: newExpiryTime
    })

  } catch (error) {
    console.error('Error in token refresh endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error during token refresh' },
      { status: 500 }
    )
  }
}
