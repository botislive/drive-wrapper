// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { DriveUploader } from '@/components/DriveUploader'
import { Sidebar } from '@/components/Sidebar'
import { CopyButton } from '@/components/CopyButton'
import { OrgCardSkeleton } from '@/components/Skeleton'

export default function Dashboard() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newOrgName, setNewOrgName] = useState('')
  const [creating, setCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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
        // For each org, fetch its summary storage usage
        const orgsWithUsage = await Promise.all(data.map(async (org) => {
          const { data: usageData } = await supabase
            .from('file_uploads')
            .select('size')
            .eq('org_id', org.id)
          
          const usage = (usageData || []).reduce((acc, row) => acc + (row.size || 0), 0)
          return { ...org, usage }
        }))
        setOrgs(orgsWithUsage)
      }
    }
    setLoading(false)
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setErrorMsg('')
    
    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create organization')
      }

      setNewOrgName('')
      await fetchOrgs()
    } catch (e: any) {
      setErrorMsg(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 md:p-10 animate-in">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Overview</h1>
            <p className="text-zinc-500 mt-1">Manage your organizations and API endpoints.</p>
          </div>
          
          <div className="flex gap-3">
            <Link
              href="/dashboard/test-sdk"
              className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition active:scale-95"
            >
              🧪 Test SDK
            </Link>
            <button
              onClick={() => (document.getElementById('orgName') as HTMLElement)?.focus()}
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-medium shadow-lg shadow-zinc-200 hover:bg-zinc-800 transition active:scale-95"
            >
              + Create Organization
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Create Org Form */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 rounded-2xl sticky top-10 animate-in">
              <h2 className="text-lg font-semibold mb-6 text-zinc-800">New Organization</h2>
              <form onSubmit={handleCreateOrg} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2" htmlFor="orgName">App Name</label>
                  <input
                    id="orgName"
                    type="text"
                    placeholder="e.g. My Awesome App"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    disabled={creating}
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition disabled:bg-zinc-50 text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>
                {errorMsg && <p className="text-xs text-red-600 font-medium">{errorMsg}</p>}
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {creating ? 'Creating Org...' : 'Initialize Organization'}
                </button>
              </form>
            </div>
          </div>

          {/* Org List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold text-zinc-800">Your Organizations</h2>
            
            {loading ? (
              <div className="space-y-4">
                <OrgCardSkeleton />
                <OrgCardSkeleton />
              </div>
            ) : orgs.length > 0 ? (
              <div className="space-y-6">
                {orgs.map((org: any, idx: number) => {
                  const totalUsage = org.usage || 0
                  const storageLimit = org.storage_limit || 10737418240
                  const usagePercent = Math.min(Math.round((totalUsage / storageLimit) * 100), 100)
                  
                  return (
                    <div 
                      key={org.id} 
                      className="glass-card p-6 rounded-2xl flex flex-col xl:flex-row gap-8 items-start animate-in group"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex-1 min-w-0 space-y-6 w-full">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-zinc-900 truncate">{org.name}</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Active Organization</p>
                          </div>
                          <Link 
                            href={`/dashboard/orgs/${org.id}`}
                            className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition active:scale-95 shadow-md shadow-zinc-100 whitespace-nowrap"
                          >
                            MANAGE DETAILS →
                          </Link>
                        </div>
                        
                        {/* Usage Progress */}
                        <div className="space-y-2">
                           <div className="flex justify-between items-end text-[10px] font-bold uppercase tracking-wider">
                             <span className="text-zinc-500">Storage Usage</span>
                             <span className={usagePercent > 80 ? 'text-red-500' : 'text-blue-600'}>
                               {usagePercent}% Used
                             </span>
                           </div>
                           <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                             <div 
                               className={`h-full transition-all duration-700 ${usagePercent > 80 ? 'bg-red-500' : 'bg-blue-600'}`}
                               style={{ width: `${usagePercent}%` }}
                             />
                           </div>
                        </div>

                        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 group-hover:border-zinc-200 transition-colors">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Live API Key</span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm text-zinc-800 font-mono truncate select-all">{org.api_key}</code>
                            <div className="ml-auto">
                              <CopyButton text={org.api_key} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full xl:w-[320px] shrink-0">
                        <DriveUploader apiKey={org.api_key} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-12 text-center glass-card rounded-2xl">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-lg font-medium text-zinc-800">Ready to go!</h3>
                <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-1 line-clamp-2">Create your first organization to start using the Drive Wrapper API.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

