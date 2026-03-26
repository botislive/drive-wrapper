// app/api/upload-session/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
    }

    const apiKey = authHeader.replace('Bearer ', '')
    const supabase = await createClient()

    // Query organization by api_key and include profile via inner join
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('*, profiles!inner(refresh_token)')
      .eq('api_key', apiKey)
      .single()

    if (orgErr || !org) {
      return NextResponse.json({ error: 'Invalid API key or organization not found' }, { status: 403 })
    }

    // @ts-ignore - Supabase join types can be tricky
    const refreshToken = org.profiles.refresh_token

    if (!refreshToken) {
      return NextResponse.json({ error: 'Google authentication required or refresh token missing. User must re-authenticate.' }, { status: 403 })
    }

    const body = await req.json()
    const { name, mimeType, size } = body

    if (!name || !mimeType || size === undefined) {
      return NextResponse.json({ error: 'name, mimeType, and size (bytes) are required in request body' }, { status: 400 })
    }

    // Check storage quota
    const { data: uploads, error: usageErr } = await supabase
      .from('file_uploads')
      .select('size')
      .eq('org_id', org.id)

    if (usageErr) {
      console.error('Error fetching usage:', usageErr)
      return NextResponse.json({ error: 'Failed to verify storage quota' }, { status: 500 })
    }

    const currentUsage = (uploads || []).reduce((acc, row) => acc + (row.size || 0), 0)
    if (currentUsage + size > org.storage_limit) {
      return NextResponse.json({ 
        error: `Storage quota exceeded. Used: ${Math.round(currentUsage / 1024 / 1024)}MB, Limit: ${Math.round(org.storage_limit / 1024 / 1024)}MB. This ${Math.round(size / 1024 / 1024)}MB file will exceed your limit.` 
      }, { status: 403 })
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
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString()
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
       console.error('Token refresh failed (upload-session):', tokenData)
       return NextResponse.json({ error: 'Failed to refresh Google token' }, { status: 500 })
    }

    const accessToken = tokenData.access_token

    // Start a resumable upload session with Google Drive
    const driveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
      },
      body: JSON.stringify({
        name,
        mimeType,
        parents: [org.google_folder_id]
      })
    })

    if (!driveRes.ok) {
      const driveError = await driveRes.json()
      console.error('Google Drive session error:', driveError)
      return NextResponse.json({ error: 'Failed to start upload session with Google Drive' }, { status: 500 })
    }

    // The location header contains the resumable upload URL
    const locationUrl = driveRes.headers.get('location')

    if (!locationUrl) {
       return NextResponse.json({ error: 'No upload URL (Location header) returned from Google Drive' }, { status: 500 })
    }

    return NextResponse.json({ uploadUrl: locationUrl })
  } catch (error) {
    console.error('Upload session route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
