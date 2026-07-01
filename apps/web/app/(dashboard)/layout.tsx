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
  ShieldCheckIcon,
  ChevronDownIcon,
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

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

function UserMenu({ email, isSuperuser, onLogout }: { email: string; isSuperuser: boolean; onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="relative border-t border-white/10 p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white shadow-lg">
          {getInitials(email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{email.split('@')[0]}</p>
          <p className="truncate text-xs text-slate-400">{email}</p>
        </div>
        <ChevronDownIcon className={classNames('h-4 w-4 shrink-0 text-slate-400 transition-transform', isOpen ? 'rotate-180' : '')} />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full left-4 right-4 mb-2 rounded-xl bg-slate-800 shadow-2xl ring-1 ring-white/10 z-20 overflow-hidden"
          onMouseLeave={() => setIsOpen(false)}
        >
          {isSuperuser && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <ShieldCheckIcon className="h-4 w-4 text-violet-400" />
              Admin Panel
            </Link>
          )}
          <button
            onClick={() => { onLogout(); setIsOpen(false) }}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ArrowRightStartOnRectangleIcon className="h-4 w-4 text-rose-400" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) { router.push('/login'); return }
      try {
        const profile = await getUserProfile(token)
        setUser(profile)
        if (profile?.is_superuser && !pathname.startsWith('/admin')) {
          router.push('/admin')
        }
      } catch {
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
    sessionStorage.removeItem('adminVerified')
    router.push('/')
  }

  if (loadingUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || (user.is_superuser && !pathname.startsWith('/admin'))) return null

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 shadow-lg">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          </div>
          <span className="text-base font-bold text-white tracking-tight">LinkShorty</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Menu</p>
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={classNames(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-violet-600/20 text-violet-300 shadow-sm ring-1 ring-violet-500/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  )}
                >
                  <item.icon className={classNames('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300')} />
                  {item.name}
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User menu at bottom */}
      {user && <UserMenu email={user.email} isSuperuser={user.is_superuser} onLogout={handleLogout} />}
    </div>
  )

  return (
    <div>
      {/* Mobile Sidebar */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <TransitionChild
            as={Fragment}
            enter="transition-opacity ease-linear duration-200"
            enterFrom="opacity-0" enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-200"
            leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </TransitionChild>
          <div className="fixed inset-0 flex">
            <TransitionChild
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full" enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0" leaveTo="-translate-x-full"
            >
              <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                    <XMarkIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div className="flex grow flex-col overflow-y-auto">
                  {sidebarContent}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Static Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        {sidebarContent}
      </div>

      {/* Main Area */}
      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-x-4 border-b border-gray-200 bg-white/80 px-4 shadow-sm backdrop-blur-md sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700" onClick={() => setSidebarOpen(true)}>
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">LinkShorty</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
              {user && getInitials(user.email)}
            </div>
          </div>
        </div>

        <main className="min-h-screen bg-gray-50/60 py-6 lg:py-8">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
