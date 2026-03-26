'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'

export default function GeneratorPage() {
  const [maxSize, setMaxSize] = useState(100)
  const [sizeUnit, setSizeUnit] = useState<'KB' | 'MB' | 'GB'>('MB')
  const [mimeType, setMimeType] = useState('*/*')
  const [language, setLanguage] = useState<'javascript' | 'typescript'>('typescript')

  const getSizeBytes = () => {
    const multipliers = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }
    return maxSize * multipliers[sizeUnit]
  }

  const backendCode = `// Backend: app/api/upload-session/route.${language === 'typescript' ? 'ts' : 'js'}
import { NextResponse } from 'next/server'

export async function POST(req${language === 'typescript' ? ': Request' : ''}) {
  const { name, mimeType, size } = await req.json()

  // 1. Validate file requirements
  const MAX_SIZE = ${getSizeBytes()} // ${maxSize}${sizeUnit}
  if (size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }

  // 2. Request session from Drive Wrapper API
  const response = await fetch('https://your-domain.com/api/upload-session', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ORG_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, mimeType, size })
  })

  const { uploadUrl } = await response.json()
  return NextResponse.json({ uploadUrl })
}`

  const frontendCode = `// Frontend: YourComponent.${language === 'typescript' ? 'tsx' : 'jsx'}
import { DriveUploaderSDK } from '@/components/SDK/uploader-sdk'

export function MyUpload() {
  const handleStartUpload = async (file${language === 'typescript' ? ': File' : ''}) => {
    // Request session from YOUR backend
    const res = await fetch('/api/upload-session', {
      method: 'POST',
      body: JSON.stringify({ 
        name: file.name, 
        mimeType: file.type,
        size: file.size 
      })
    })
    const { uploadUrl } = await res.json()
    return uploadUrl
  }

  return (
    <DriveUploaderSDK 
      uploadUrl={/* dynamic uploadUrl from your state */} 
      maxSize={${getSizeBytes()}}
      onSuccess={async (file) => {
        // Track the upload for analytics
        await fetch('/api/upload-complete', {
          method: 'POST',
          body: JSON.stringify({ 
            name: file.name, 
            size: file.size,
            mimeType: file.type,
            googleFileId: 'resumable-success' 
          })
        })
        alert('Uploaded!')
      }}
      onProgress={(p) => console.log(\`Progress: \${p}%\`)}
    />
  )
}`

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 animate-in">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Snippet Generator</h1>
        <p className="text-zinc-500 mt-2 text-lg">Configure your requirements and get instant integration code.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Config Side */}
        <div className="lg:col-span-4 space-y-8">
          <section className="glass-card p-6 rounded-2xl border border-zinc-200">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Configuration</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Max File Size</label>
                <div className="flex bg-white border border-zinc-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                  <input 
                    type="number" 
                    value={maxSize}
                    onChange={(e) => setMaxSize(parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-3 text-sm text-zinc-900 outline-none border-r border-zinc-100"
                  />
                  <select 
                    value={sizeUnit}
                    onChange={(e) => setSizeUnit(e.target.value as any)}
                    className="px-3 py-3 bg-zinc-50 text-xs font-bold text-zinc-600 outline-none cursor-pointer hover:bg-zinc-100 transition"
                  >
                    <option>KB</option>
                    <option>MB</option>
                    <option>GB</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {['typescript', 'javascript'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang as any)}
                      className={`py-3 px-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest ${
                        language === lang 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Mime Type</label>
                <div className="relative">
                  <select 
                    value={mimeType}
                    onChange={(e) => setMimeType(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/10 appearance-none cursor-pointer"
                  >
                    <option value="*/*">All Files</option>
                    <option value="image/*">Images Only</option>
                    <option value="video/*">Videos Only</option>
                    <option value="application/pdf">PDFs Only</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    ▼
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
            <h3 className="text-xs font-bold text-blue-900 uppercase mb-2">Pro Tip 💡</h3>
            <p className="text-xs text-blue-800/80 leading-relaxed">
              Large files (up to 5GB) are supported via resumable sessions. Ensure your server timeout is high enough if you do any post-processing, though direct-to-cloud bypasses it!
            </p>
          </div>
        </div>

        {/* Code Side */}
        <div className="lg:col-span-8 space-y-8">
          {/* Backend Snippet */}
          <section className="glass-card overflow-hidden rounded-2xl border border-zinc-200 shadow-xl">
            <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">1. Backend (Server-Side)</h3>
              <CopyButton text={backendCode} />
            </div>
            <div className="p-6 bg-zinc-900 overflow-x-auto">
              <pre className="text-[13px] text-zinc-300 font-mono leading-relaxed">
                {backendCode}
              </pre>
            </div>
          </section>

          {/* Frontend Snippet */}
          <section className="glass-card overflow-hidden rounded-2xl border border-zinc-200 shadow-xl">
            <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">2. Frontend (Client-Side)</h3>
              <CopyButton text={frontendCode} />
            </div>
            <div className="p-6 bg-zinc-900 overflow-x-auto">
              <pre className="text-[13px] text-zinc-300 font-mono leading-relaxed">
                {frontendCode}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
