'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function OrgDetailsPage() {
  const { id } = useParams()
  const [org, setOrg] = useState<any>(null)
  const [uploads, setUploads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    
    // Fetch org details
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (orgData) {
      setOrg(orgData)
      
      // Fetch uploads
      const { data: uploadsData } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('org_id', id)
        .order('created_at', { ascending: false })
      
      if (uploadsData) setUploads(uploadsData)
    }
    
    setLoading(false)
  }

  const formatSize = (bytes: number | null | undefined) => {
    const b = Number(bytes)
    if (isNaN(b) || b <= 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(b) / Math.log(k))
    if (i < 0) return '0 B'
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + (sizes[i] || 'B')
  }

  if (loading) return <div className="p-10 animate-pulse text-zinc-400">Loading organization data...</div>
  if (!org) return <div className="p-10 text-red-500">Organization not found.</div>

  const totalUsage = uploads.reduce((acc, u) => acc + Number(u.size || 0), 0)
  const storageLimit = Number(org.storage_limit || 0)
  const usagePercent = storageLimit > 0 ? Math.min(Math.round((totalUsage / storageLimit) * 100), 100) : 0

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 animate-in">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 mb-4">
            ← Back to Overview
          </Link>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight">{org.name}</h1>
          <p className="text-zinc-500">Manage storage, view uploads, and monitor API activity.</p>
        </div>
        
        <div className="flex gap-3">
          <a 
            href={`https://drive.google.com/drive/folders/${org.google_folder_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition"
          >
            Drive Folder 📂
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Stats & Info */}
        <div className="lg:col-span-1 space-y-8">
          {/* Usage Card */}
          <section className="glass-card p-8 rounded-3xl border border-zinc-200 relative overflow-hidden">
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Storage Usage</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-3xl font-black text-zinc-900">{usagePercent}%</span>
                <span className="text-xs font-bold text-zinc-500 mb-1">{formatSize(totalUsage)} / {formatSize(storageLimit)}</span>
              </div>
              
              <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              
              <p className="text-[10px] text-zinc-400 font-medium italic">
                {formatSize(Math.max(0, storageLimit - totalUsage))} remaining before quota limit.
              </p>
            </div>
          </section>

          {/* API Info */}
          <section className="glass-card p-8 rounded-3xl border border-zinc-200">
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">API Details</h2>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Organization ID</span>
                <code className="text-xs bg-zinc-50 p-2 rounded-lg block border border-zinc-100 truncate text-zinc-900 font-mono">{org.id}</code>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Google Folder ID</span>
                <code className="text-xs bg-zinc-50 p-2 rounded-lg block border border-zinc-100 truncate text-zinc-900 font-mono">{org.google_folder_id}</code>
              </div>
            </div>
          </section>

          {/* Settings Section */}
          <section className="glass-card p-8 rounded-3xl border border-zinc-200">
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-6">Configuration</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-2">Storage Limit (GB)</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    defaultValue={Math.round((org.storage_limit || 0) / (1024 ** 3))}
                    id="storageLimitInput"
                    className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                  <button
                    onClick={async () => {
                      const val = parseInt((document.getElementById('storageLimitInput') as HTMLInputElement).value)
                      if (isNaN(val) || val <= 0) return alert('Invalid limit')
                      
                      const res = await fetch(`/api/orgs/${org.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ storage_limit: val * (1024 ** 3) })
                      })
                      
                      if (res.ok) {
                        alert('Storage limit updated!')
                        window.location.reload()
                      } else {
                        const err = await res.json()
                        alert(`Failed to update: ${err.error || 'Unknown error'}`)
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                  >
                    SAVE
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 italic">Changes take effect immediately for all new upload sessions.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Upload History */}
        <div className="lg:col-span-2 space-y-8">
          <section className="glass-card rounded-3xl border border-zinc-200 overflow-hidden min-h-[500px]">
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Recent Uploads</h2>
              <span className="text-[10px] font-bold bg-zinc-900 text-white px-2.5 py-1 rounded-full">{uploads.length} TOTAL</span>
            </div>

            <div className="overflow-x-auto">
              {uploads.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50">
                    <tr>
                      <th className="px-8 py-4">File Name</th>
                      <th className="px-4 py-4 text-right">Size</th>
                      <th className="px-8 py-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {uploads.map((upload) => (
                      <tr key={upload.id} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">📄</span>
                            <div>
                               <p className="text-sm font-bold text-zinc-800 line-clamp-1">{upload.name}</p>
                               <p className="text-[10px] text-zinc-400 uppercase">{upload.mime_type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-xs font-bold text-zinc-600">
                          {formatSize(upload.size)}
                        </td>
                        <td className="px-8 py-4 text-right text-[10px] font-medium text-zinc-400 whitespace-nowrap">
                          {new Date(upload.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-20 text-center">
                  <div className="text-4xl mb-4 opacity-20">☁️</div>
                  <p className="text-zinc-400 text-sm font-medium">No uploads tracked yet.</p>
                  <p className="text-xs text-zinc-300 mt-1">Files uploaded via the SDK will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
