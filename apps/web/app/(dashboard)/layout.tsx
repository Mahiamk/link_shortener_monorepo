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
  List,
  X,
  Lightning,
  Sparkle,
  Crown,
  CreditCard,
  CircleNotch,
} from '@phosphor-icons/react'
import {
  getUserProfile,
  User,
  createCheckoutSession,
  createCustomerPortalSession,
} from '../../lib/api'

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

function PlanBadge({ plan }: { plan?: string }) {
  const p = (plan || 'free').toLowerCase()
  if (p === 'pro') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
        <Lightning weight="fill" className="h-3 w-3" />
        PRO
      </span>
    )
  }
  if (p === 'enterprise') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
        <Crown weight="fill" className="h-3 w-3" />
        ENTERPRISE
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
      FREE
    </span>
  )
}

function UserMenu({
  user,
  onLogout,
}: {
  user: User
  onLogout: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const handleOpenPortal = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setPortalLoading(true)
    try {
      const res = await createCustomerPortalSession(token)
      if (res.portal_url) {
        window.location.href = res.portal_url
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not open billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1 text-left hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-xs">
          {getInitials(user.email)}
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-60 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200 z-50 overflow-hidden"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-slate-900">{user.email.split('@')[0]}</p>
              <PlanBadge plan={user.plan} />
            </div>
            <p className="truncate text-[11px] text-slate-400 mt-0.5">{user.email}</p>
          </div>

          {user.is_superuser && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <ShieldCheck weight="duotone" className="h-4 w-4 text-indigo-600" />
              Admin Console
            </Link>
          )}

          {user.stripe_customer_id && (
            <button
              onClick={handleOpenPortal}
              disabled={portalLoading}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              {portalLoading ? (
                <CircleNotch weight="bold" className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <CreditCard weight="duotone" className="h-4 w-4 text-indigo-600" />
              )}
              Manage Subscription
            </button>
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
  const [upgradeLoading, setUpgradeLoading] = useState(false)

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

  const handleUpgradeToPro = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    setUpgradeLoading(true)
    try {
      const res = await createCheckoutSession(token, 'pro', 'monthly')
      if (res.checkout_url) {
        window.location.href = res.checkout_url
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not start checkout.')
    } finally {
      setUpgradeLoading(false)
    }
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

      {user?.is_superuser && (
        <li className="pt-2 border-t border-slate-100 mt-2">
          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100/80 transition-colors"
          >
            <ShieldCheck weight="duotone" className="h-5 w-5 text-indigo-600 shrink-0" />
            <span>Admin Console</span>
          </Link>
        </li>
      )}
    </ul>
  )

  const isFreePlan = !user?.plan || user.plan.toLowerCase() === 'free'

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
                <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col justify-between">
                  {renderNavLinks()}

                  {isFreePlan && (
                    <div className="mt-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 border border-indigo-100 text-center">
                      <Lightning weight="duotone" className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-slate-900">Upgrade to Pro</h4>
                      <p className="text-[11px] text-slate-500 mt-1">Unlock deep D3 audience trends & priority analytics.</p>
                      <button
                        onClick={handleUpgradeToPro}
                        disabled={upgradeLoading}
                        className="mt-3 w-full rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {upgradeLoading ? 'Opening Checkout...' : 'Upgrade ($9/mo)'}
                      </button>
                    </div>
                  )}
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

        <nav className="flex-1 px-4 py-6 flex flex-col justify-between overflow-y-auto">
          {renderNavLinks()}

          {/* Upgrade Banner / Pro Status */}
          {user && (
            <div className="mt-auto pt-6">
              {isFreePlan ? (
                <div className="rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 p-4 border border-indigo-100 shadow-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white">
                      <Lightning weight="fill" className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Upgrade to Pro</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Get deep traffic intelligence and overall breakdowns.
                  </p>
                  <button
                    onClick={handleUpgradeToPro}
                    disabled={upgradeLoading}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-all"
                  >
                    {upgradeLoading ? (
                      <CircleNotch weight="bold" className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkle weight="duotone" className="h-3.5 w-3.5" />
                    )}
                    <span>Upgrade for $9</span>
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl bg-emerald-50/80 p-3.5 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlanBadge plan={user.plan} />
                    <span className="text-xs font-semibold text-emerald-950">Plan Active</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {user && (
          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {getInitials(user.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-semibold text-slate-900">
                      {user.email.split('@')[0]}
                    </p>
                    <PlanBadge plan={user.plan} />
                  </div>
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
                user={user}
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
