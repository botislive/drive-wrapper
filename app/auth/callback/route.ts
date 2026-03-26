// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && session) {
      if (session.provider_refresh_token) {
        // Update the refresh token directly
        await supabase.from('profiles').update({
          refresh_token: session.provider_refresh_token
        }).eq('id', session.user.id)
      } else {
        console.warn('No provider_refresh_token returned from Google. Ensure access_type=offline and prompt=consent are used.')
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
