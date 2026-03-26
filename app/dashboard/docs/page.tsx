// app/dashboard/docs/page.tsx
import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in">
      <div className="mb-10">

        <div className="flex items-center justify-between gap-4 mb-4">
          <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
            ← Back to Dashboard
          </Link>
          <Link href="/dashboard/test-sdk" className="text-xs font-bold bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition">
            LIVE PLAYGROUND 🧪
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Developer Documentation</h1>
        <p className="text-zinc-500 mt-2 text-lg">Integrate direct-to-cloud uploads into your own apps in minutes.</p>
      </div>

      <div className="grid gap-12">
        {/* Step 1 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">1</span>
            <h2 className="text-xl font-semibold text-zinc-900">Request an Upload Session (Backend)</h2>
          </div>
          <p className="text-zinc-600 mb-4">
            Your backend must request a secure resumable upload URL from our API using your <strong>Organization API Key</strong>. 
            This prevents expose of your keys to the client.
          </p>
          <div className="bg-zinc-900 rounded-xl p-5 overflow-x-auto">
            <pre className="text-sm text-zinc-300">
{`// Example: Node.js (Next.js/Express)
const response = await fetch('https://your-domain.com/api/upload-session', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ORG_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'user-report.pdf',
    mimeType: 'application/pdf'
  })
})

const { uploadUrl } = await response.json()`}
            </pre>
          </div>
        </section>

        {/* Step 2 */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">2</span>
            <h2 className="text-xl font-semibold text-zinc-900">Direct Upload (Frontend SDK)</h2>
          </div>
          <p className="text-zinc-600 mb-4">
            Pass the <code className="bg-zinc-100 px-1 rounded text-pink-600">uploadUrl</code> from your backend to our SDK component. 
            The file will stream directly to Google Drive, bypassing your server.
          </p>
          <div className="bg-zinc-900 rounded-xl p-5 overflow-x-auto">
            <pre className="text-sm text-zinc-300">
{`import { DriveUploaderSDK } from '@/components/SDK/uploader-sdk'

// In your React Component
<DriveUploaderSDK 
  uploadUrl={dataFromYourBackend.uploadUrl} 
  onSuccess={() => alert('Done!')}
  onProgress={(p) => console.log(\`Progress: \${p}%\`)}
/>`}
            </pre>
          </div>
        </section>

        {/* Technical architecture */}
        <section className="bg-blue-50/50 border border-blue-100 rounded-2xl p-8 mt-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Why this architecture?</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-bold text-blue-800 uppercase mb-2">🚀 No Payload Limits</h4>
              <p className="text-sm text-blue-800/80">Vercel and other serverless platforms limit payloads to ~4MB. Our SDK sends files <strong>directly</strong> to the cloud, allowing for multi-GB uploads.</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-800 uppercase mb-2">🔒 Secure-by-Design</h4>
              <p className="text-sm text-blue-800/80">Your Google credentials and API keys stay on the server. The client only sees a one-time signed upload URL.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
