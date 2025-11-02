'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfile, User } from '@/lib/api' 
import { AdminSidebar } from '@/components/admin/AdminSideBar' 
import { Bars3Icon } from '@heroicons/react/24/outline'

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

      try {
        const user: User = await getUserProfile(token)
        if (user && user.is_superuser) {
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Verifying admin access...</p>
      </div>
    )
  }

  // If verified as admin, show the admin layout
  if (isAdmin) {
    return (
      <div className="flex h-screen bg-gray-50/50 overflow-hidden">
        <AdminSidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />

        {/* Main content area (This will scroll) */}
        <main className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-6 border-b border-gray-200 bg-white/75 px-4 shadow-sm backdrop-blur-sm lg:hidden">
            <button 
              type="button" 
              className="-m-2.5 p-2.5 text-gray-700" 
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          {/* Page content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    )
  }

  // This is a fallback, should not reach here due to redirects
  return null
}

