// components/StorageMetrics.tsx
'use client'

import { useEffect, useState } from 'react'

interface StorageQuota {
  limit: string
  usage: string
  usageInDrive: string
  usageInDriveTrash: string
}

export function StorageMetrics() {
  const [quota, setQuota] = useState<StorageQuota | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/storage-quota')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setQuota(data)
      })
      .catch(err => console.error('Failed to load storage quota:', err))
      .finally(() => setLoading(false))
  }, [])

  const formatSize = (bytes: string) => {
    const b = parseInt(bytes)
    if (isNaN(b)) return '0 B'
    const tb = b / (1024 ** 4)
    if (tb >= 1) return `${tb.toFixed(1)} TB`
    const gb = b / (1024 ** 3)
    if (gb >= 1) return `${gb.toFixed(1)} GB`
    const mb = b / (1024 ** 2)
    return `${mb.toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse px-4 py-3">
        <div className="h-3 bg-zinc-200 rounded-full w-full" />
        <div className="h-2 bg-zinc-100 rounded-full w-2/3" />
      </div>
    )
  }

  if (!quota) return null

  const limit = parseInt(quota.limit)
  const usage = parseInt(quota.usage)
  const percentage = limit > 0 ? Math.min(Math.round((usage / limit) * 100), 100) : 0
  const isHigh = percentage > 85

  return (
    <div className="px-4 py-3 space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Storage</span>
        <span className="text-[10px] font-bold text-zinc-600">{percentage}%</span>
      </div>
      
      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out rounded-full ${isHigh ? 'bg-amber-500' : 'bg-blue-600'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-[11px] text-zinc-600 font-medium">
        {formatSize(quota.usage)} of {formatSize(quota.limit)} used
      </p>
    </div>
  )
}
