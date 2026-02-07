'use client'

import { Fragment, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  LinkIcon as LinkOutlineIcon,
  ChartBarIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { getUserProfile, User } from '../../lib/api'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  { name: 'Your Links', href: '/dashboard/links', icon: LinkOutlineIcon },
  { name: 'Analysis', href: '/dashboard/analysis', icon: ChartBarIcon },
]

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function UserMenu({ email, isSuperuser, onLogout }: { email: string, isSuperuser: boolean, onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        <UserCircleIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-60 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="truncate text-sm font-medium text-gray-900">{email}</p>
            </div>
            {isSuperuser && (
              <Link
                href="/admin"
                className="group flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <ShieldCheckIcon className="h-5 w-5 text-gray-500 group-hover:text-gray-600" />
                Admin Panel
              </Link>
            )}
            <button
              onClick={() => { onLogout(); setIsOpen(false); }}
              className="group flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-100"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false) // State to control sidebar
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      // ... (user fetching logic remains the same) ...
       const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }
      try {
        const profile = await getUserProfile(token)
        setUser(profile)
        if (profile?.is_superuser) {
           if (!pathname.startsWith('/admin')) {
              router.push('/admin');
           }
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error)
        localStorage.removeItem('token')
        localStorage.removeItem('userEmail')
        router.push('/login')
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUser()
  }, [router, pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    router.push('/')
  }

  if (loadingUser) {
    return <div className="flex h-screen items-center justify-center">Loading user...</div>
  }

  if (!user || (user.is_superuser && !pathname.startsWith('/admin'))) {
    return null;
  }

  // Define sidebar content separately for reuse
  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6 bg-white">
        <Link 
        href="/dashboard"className="flex items-center gap-2">
           <svg className="h-8 w-auto text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
          </svg>
          <span className="text-lg font-semibold text-gray-600">LinkShorty</span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col overflow-y-auto bg-white p-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                 const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                <li key={item.name}>
                  {/* ✅ --- ADD onClick TO CLOSE SIDEBAR --- */}
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)} // <-- ADD THIS LINE
                    className={classNames(
                      isActive
                        ? 'bg-gray-50 text-gray-600'
                        : 'text-gray-700 hover:text-gray-600 hover:bg-gray-50',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon
                      className={classNames(
                        isActive ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-600',
                        'h-6 w-6 shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                  {/* ✅ --- END ADDITION --- */}
                </li>
              )})}
            </ul>
          </li>
          <li className="mt-auto -mx-6"></li>
        </ul>
      </nav>
    </>
  );

  return (
    <>
      <div>
        {/* Mobile Sidebar */}
        <Transition show={sidebarOpen} as={Fragment}>
          <Dialog className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <TransitionChild as={Fragment} /* ... */ >
              <div className="fixed inset-0 bg-gray-900/80" />
            </TransitionChild>
            <div className="fixed inset-0 flex">
              <TransitionChild as={Fragment} /* ... */ >
                <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <TransitionChild as={Fragment} /* ... */ >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                        <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </button>
                    </div>
                  </TransitionChild>
                  {/* Sidebar content uses the definition which now includes the onClick */}
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white pb-4 ring-1 ring-white/10">
                    {sidebarContent}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </Dialog>
        </Transition>

        {/* Static Sidebar Desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-gray-200 lg:overflow-hidden">
          {sidebarContent}
        </div>

        {/* Main Area */}
        <div className="lg:pl-72">
          {/* Header */}
          <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/75 px-4 shadow-sm backdrop-blur-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />
            <div className="flex flex-1 justify-end gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <UserMenu
                        email={user.email}
                        isSuperuser={user.is_superuser}
                        onLogout={handleLogout}
                    />
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="py-10">
            <div className="px-4 sm:px-6 lg:px-8 h-[calc(100vh-64px)] overflow-y-auto">{children}</div>
          </main>
        </div>
      </div>
    </>
  )
}