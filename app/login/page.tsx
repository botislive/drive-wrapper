// app/login/page.tsx
'use client'

import { createClient, getURL } from '@/utils/supabase/client'

export default function Login() {
  const supabase = createClient()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/drive.file',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: `${getURL()}auth/callback?next=/dashboard`,
      },
    })
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Sign in to Drive Wrapper</h1>
        <button
          onClick={handleSignIn}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
