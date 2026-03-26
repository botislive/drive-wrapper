'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { DriveUploaderSDK } from '@/components/SDK/uploader-sdk'
import { CopyButton } from '@/components/CopyButton'

export default function TestSDKPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [uploadUrl, setUploadUrl] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [fileName, setFileName] = useState('test-file.txt')
  const [mimeType, setMimeType] = useState('text/plain')

  const supabase = createClient()

  useEffect(() => {
    fetchOrgs()
  }, [])

  const fetchOrgs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
      
      if (!error && data) {
        setOrgs(data)
        if (data.length > 0) setSelectedOrg(data[0])
      }
    }
    setLoading(false)
  }

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev])
  }

  const requestSession = async () => {
    if (!selectedOrg) return
    
    setSessionLoading(true)
    addLog(`Requesting upload session for "${fileName}"...`)
    
    try {
      const res = await fetch('/api/upload-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${selectedOrg.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: mimeType
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to get session')
      }

      const { uploadUrl } = await res.json()
      setUploadUrl(uploadUrl)
      addLog('Session acquired! Ready to upload.')
    } catch (e: any) {
      addLog(`Error: ${e.message}`)
    } finally {
      setSessionLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 animate-in">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 mb-4">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">SDK Localhost Playground</h1>
        <p className="text-zinc-500 mt-2">Test your direct-to-cloud integration in real-time.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Step 1: Select Org */}
          <section className="glass-card p-6 rounded-2xl border border-zinc-200">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Step 1: Select Organization</h2>
            {loading ? (
              <p className="text-sm text-zinc-500">Loading organizations...</p>
            ) : orgs.length > 0 ? (
              <select 
                className="w-full p-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-zinc-900"
                value={selectedOrg?.id}
                onChange={(e) => setSelectedOrg(orgs.find(o => o.id === e.target.value))}
              >
                {orgs.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-red-500">No organizations found. Please create one first.</p>
            )}
            
            {selectedOrg && (
              <div className="mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Live API Key</span>
                  <code className="text-[11px] font-mono text-zinc-900 break-all">{selectedOrg.api_key}</code>
                </div>
                <div className="shrink-0 scale-90 origin-right">
                  <CopyButton text={selectedOrg.api_key} />
                </div>
              </div>
            )}
          </section>

          {/* Step 2: Request Session */}
          <section className="glass-card p-6 rounded-2xl border border-zinc-200">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Step 2: Request Session</h2>
            <div className="space-y-3 mb-4">
              <input 
                type="text" 
                placeholder="File name"
                className="w-full p-2 text-sm border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Mime type"
                className="w-full p-2 text-sm border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-400"
                value={mimeType}
                onChange={(e) => setMimeType(e.target.value)}
              />
            </div>
            <button 
              onClick={requestSession}
              disabled={!selectedOrg || sessionLoading}
              className="w-full bg-zinc-900 text-white font-bold py-3 rounded-xl hover:bg-zinc-800 transition disabled:opacity-50 shadow-lg shadow-zinc-200"
            >
              {sessionLoading ? 'Getting URL...' : 'Generate Upload URL'}
            </button>
          </section>

          {/* Step 3: SDK Component */}
          <section className={`glass-card p-6 rounded-2xl border border-zinc-200 transition-opacity ${!uploadUrl ? 'opacity-50 pointer-events-none' : 'opacity-100 ring-4 ring-blue-500/10'}`}>
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Step 3: SDK UI Component</h2>
            <DriveUploaderSDK 
              uploadUrl={uploadUrl}
              onProgress={(p) => addLog(`Progress: ${p}%`)}
              onSuccess={() => {
                addLog('✅ SUCCESS: File uploaded directly to Drive!')
                setUploadUrl('') // Reset for next test
              }}
              onError={(err) => addLog(`❌ ERROR: ${err}`)}
              label="Test Upload via SDK"
              buttonClassName="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-200"
            />
          </section>
        </div>

        {/* Logs Bar */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-200 h-fit">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Developer Logs</h2>
          <div className="bg-zinc-900 rounded-xl p-4 h-[400px] overflow-y-auto font-mono text-[11px] space-y-2">
            {logs.length === 0 ? (
              <p className="text-zinc-600">Waiting for actions...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-green-400' : 'text-zinc-300'}>
                  {log}
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => setLogs([])}
            className="mt-4 text-xs text-zinc-400 hover:text-zinc-600 transition"
          >
            Clear logs
          </button>
        </div>
      </div>
    </div>
  )
}
