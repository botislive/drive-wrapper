import Image from "next/image";

export default function Home() {
  const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!isConfigured) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans p-6 text-zinc-900">
        <div className="max-w-2xl w-full bg-white border border-zinc-200 rounded-2xl shadow-xl p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
            <h1 className="text-2xl font-bold tracking-tight">Drive Wrapper Setup</h1>
          </div>
          
          <div className="space-y-6">
            <p className="text-zinc-600 leading-relaxed">
              Welcome! To get started, you need to connect your Supabase project. We've updated the code to handle this gracefully.
            </p>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
              <p className="font-semibold mb-1">Action Required:</p>
              <p>Please ensure you have a Supabase project ready. If you've reached your free project limit, you'll need to pause or delete an old project first.</p>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Next Steps</h2>
              <ol className="space-y-3">
                <li className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Create a Supabase project at <a href="https://database.new" target="_blank" className="text-blue-600 hover:underline">database.new</a></span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Copy your API keys from the Supabase Dashboard.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Create a <code>.env.local</code> file in this directory and paste the keys (see <code>.env.example</code>).</span>
                </li>
              </ol>
            </div>

            <div className="pt-6 border-t border-zinc-100">
              <a 
                href="/login" 
                className="inline-flex items-center justify-center h-12 px-6 font-medium tracking-wide text-white transition duration-200 rounded shadow-md bg-zinc-900 hover:bg-zinc-800 focus:shadow-outline focus:outline-none w-full sm:w-auto"
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans p-6">
      <main className="flex flex-col items-center gap-8 max-w-2xl text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">D</div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Drive Wrapper SaaS
        </h1>
        <p className="text-lg text-zinc-600 leading-relaxed">
          The developer-friendly REST API wrapper around Google Drive. Bypass server limits and stream files directly to the cloud.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href="/login"
            className="flex h-12 items-center justify-center px-8 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-md"
          >
            Get Started
          </a>
          <a
            href="https://github.com"
            target="_blank"
            className="flex h-12 items-center justify-center px-8 rounded-full border border-zinc-300 bg-white font-medium hover:bg-zinc-50 transition"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  )
}

