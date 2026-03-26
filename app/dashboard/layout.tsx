// app/dashboard/layout.tsx
import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        {children}
      </main>
    </div>
  )
}
