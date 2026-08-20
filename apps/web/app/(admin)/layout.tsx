'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfile, User } from '@/lib/api'
import { AdminSidebar } from '@/components/admin/AdminSideBar'
import { List, CircleNotch } from '@phosphor-icons/react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      if (sessionStorage.getItem('adminVerified') === 'true') {
        setIsAdmin(true)
        setLoading(false)
        return
      }

      try {
        const user: User = await getUserProfile(token)
        if (user && user.is_superuser) {
          sessionStorage.setItem('adminVerified', 'true')
          setIsAdmin(true)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200/80 bg-white/80 px-4 shadow-xs backdrop-blur-md lg:hidden">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-slate-700 hover:text-slate-900"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <List weight="duotone" className="h-6 w-6" />
            </button>
            <span className="text-sm font-bold text-slate-900">Admin Console</span>
          </div>

          {/* Page content */}
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    )
  }

  return null
}
