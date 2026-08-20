'use client'

import { Fragment, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import {
  House,
  LinkSimple,
  ChartBar,
  SignOut,
  ShieldCheck,
  CaretDown,
  List,
  X,
  UserCircle,
} from '@phosphor-icons/react'
import { getUserProfile, User } from '../../lib/api'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: House },
  { name: 'Your Links', href: '/dashboard/links', icon: LinkSimple },
  { name: 'Analysis', href: '/dashboard/analysis', icon: ChartBar },
]

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

function UserMenu({
  email,
  isSuperuser,
  onLogout,
}: {
  email: string
  isSuperuser: boolean
  onLogout: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1 text-left hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-xs">
          {getInitials(email)}
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200 z-50 overflow-hidden"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="truncate text-xs font-semibold text-slate-900">{email.split('@')[0]}</p>
            <p className="truncate text-[11px] text-slate-400">{email}</p>
          </div>

          {isSuperuser && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <ShieldCheck weight="duotone" className="h-4 w-4 text-indigo-600" />
              Admin Panel
            </Link>
          )}

          <button
            onClick={() => {
              onLogout()
              setIsOpen(false)
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <SignOut weight="duotone" className="h-4 w-4" />
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
      if (!token) {
        router.push('/login')
        return
      }
      try {
        const profile = await getUserProfile(token)
        setUser(profile)
        if (profile?.is_superuser && !pathname.startsWith('/admin') && pathname === '/dashboard-redirect') {
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
    router.push('/login')
  }

  const renderNavLinks = () => (
    <ul role="list" className="space-y-1">
      {navigation.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
        return (
          <li key={item.name}>
            <Link
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={classNames(
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium',
                'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
              )}
            >
              <item.icon
                weight="duotone"
                className={classNames(
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600',
                  'h-5 w-5 shrink-0 transition-colors',
                )}
              />
              {item.name}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Mobile Drawer */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <TransitionChild
            as={Fragment}
            enter="transition-opacity ease-linear duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 flex">
            <TransitionChild
              as={Fragment}
              enter="transition ease-in-out duration-200 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-200 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1 flex-col bg-white">
                <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
                  <Link href="/" className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
                      <LinkSimple weight="duotone" className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900">
                      LinkShorty
                    </span>
                  </Link>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-700"
                  >
                    <X weight="duotone" className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  {renderNavLinks()}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Desktop Sidebar (matching user.png) */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-100 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-xs">
              <LinkSimple weight="duotone" className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              LinkShorty
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6">
          {renderNavLinks()}
        </nav>

        {user && (
          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {getInitials(user.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {user.email.split('@')[0]}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
              >
                <SignOut weight="duotone" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-m-2.5 p-2.5 text-slate-500 hover:text-slate-900 lg:hidden"
            >
              <List weight="duotone" className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <UserMenu
                email={user.email}
                isSuperuser={Boolean(user.is_superuser)}
                onLogout={handleLogout}
              />
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
