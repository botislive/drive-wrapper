// app/api/orgs/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { storage_limit } = body

    if (storage_limit === undefined) {
      return NextResponse.json({ error: 'storage_limit is required' }, { status: 400 })
    }

    // Update organization if it belongs to the user
    const { data, error } = await supabase
      .from('organizations')
      .update({ storage_limit })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update org:', error)
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Org update route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
