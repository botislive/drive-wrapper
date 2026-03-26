// app/api/orgs/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Retrieve the user's refresh_token
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('refresh_token')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile?.refresh_token) {
      return NextResponse.json({ error: 'Google authentication required or refresh token missing. Please sign in again.' }, { status: 403 })
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables')
      return NextResponse.json({ error: 'Server configuration error: missing Google credentials' }, { status: 500 })
    }

    // Exchange refresh token for fresh access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: profile.refresh_token,
        grant_type: 'refresh_token',
      }).toString()
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
       console.error('Token refresh failed:', tokenData)
       return NextResponse.json({ error: 'Failed to refresh Google token' }, { status: 500 })
    }

    const accessToken = tokenData.access_token

    // Create a folder in Google Drive
    const driveRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder'
      })
    })

    const folderData = await driveRes.json().catch(() => ({}))
    
    if (!driveRes.ok) {
      console.error('Google Drive Folder creation failed:', {
        status: driveRes.status,
        error: folderData
      });
      return NextResponse.json({ 
        error: 'Failed to create Google Drive folder', 
        details: folderData?.error?.message || 'Unknown Google Drive error'
      }, { status: 500 })
    }

    // Generate API Key
    const apiKey = 'pk_live_' + crypto.randomBytes(24).toString('hex')

    // Save to organizations
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        user_id: user.id,
        name,
        google_folder_id: folderData.id,
        api_key: apiKey
      })
      .select()
      .single()

    if (orgErr) {
       console.error('Failed to save org to DB:', orgErr)
       return NextResponse.json({ error: 'Failed to save organization to database' }, { status: 500 })
    }

    return NextResponse.json(org)
  } catch (error) {
    console.error('Org creation route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
