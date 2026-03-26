// app/api/storage-quota/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch refresh token
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('refresh_token')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile?.refresh_token) {
      return NextResponse.json({ error: 'Google account not connected or refresh token missing' }, { status: 403 })
    }

    // Refresh token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: profile.refresh_token,
        grant_type: 'refresh_token',
      }).toString()
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'Failed to refresh Google token' }, { status: 500 })
    }

    // 1. Fetch aggregate usage from file_uploads
    const { data: usageData, error: usageErr } = await supabase
      .from('file_uploads')
      .select('size')
    
    // 2. Fetch aggregate limit from organizations
    const { data: orgsData, error: orgsErr } = await supabase
      .from('organizations')
      .select('storage_limit')

    if (usageErr || orgsErr) {
       console.error('Usage/Orgs fetch error:', usageErr || orgsErr)
       return NextResponse.json({ error: 'Failed to fetch aggregate storage data' }, { status: 500 })
    }

    const totalUsage = (usageData || []).reduce((acc, row) => acc + (row.size || 0), 0)
    const totalLimit = (orgsData || []).reduce((acc, row) => acc + (row.storage_limit || 0), 0)

    // Fetch Google Drive quota (The real capacity)
    const driveRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    })
    const driveData = await driveRes.json()

    return NextResponse.json({
      ...driveData.storageQuota,
      virtual: {
        limit: totalLimit.toString(),
        usage: totalUsage.toString()
      }
    })
  } catch (error) {
    console.error('Storage quota error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
