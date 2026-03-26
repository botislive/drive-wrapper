// app/api/upload-complete/route.ts
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

    // 1. Verify organization
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (orgErr || !org) {
      return NextResponse.json({ error: 'Invalid API key or organization not found' }, { status: 403 })
    }

    // 2. Register the upload
    const body = await req.json()
    const { name, size, mimeType, googleFileId } = body

    if (!name || !size || !googleFileId) {
      return NextResponse.json({ error: 'name, size, and googleFileId are required' }, { status: 400 })
    }

    const { error: insertErr } = await supabase
      .from('file_uploads')
      .insert({
        org_id: org.id,
        name,
        size,
        mime_type: mimeType,
        google_file_id: googleFileId
      })

    if (insertErr) {
      console.error('Failed to record upload:', insertErr)
      return NextResponse.json({ error: 'Failed to record upload in database' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Upload complete route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
