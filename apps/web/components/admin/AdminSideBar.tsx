'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import {
  House,
  Users,
  LinkSimple,
  EnvelopeSimple,
  SignOut,
  X,
} from '@phosphor-icons/react'

const navItems = [
  { name: 'Overview', href: '/admin', icon: House },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Links', href: '/admin/links', icon: LinkSimple },
  { name: 'Submissions', href: '/admin/submissions', icon: EnvelopeSimple },
]

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function NavigationContent() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Sidebar Header (matching admin.png) */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-indigo-600">
            LinkShorty
          </span>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            Admin
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <nav>
          <ul role="list" className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === item.href
                  : pathname.startsWith(item.href)

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
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
        </nav>
      </div>

      {/* Sidebar Footer (Exit Admin) matching admin.png */}
      <div className="border-t border-slate-100 p-4">
        <Link
          href="/dashboard"
          className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <SignOut weight="duotone" className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
          Exit Admin
        </Link>
      </div>
    </div>
  )
}

export function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}) {
  return (
    <>
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
              <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1 bg-white">
                <div className="absolute right-0 top-0 -mr-12 pt-4">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-white hover:text-slate-200"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <X weight="bold" className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex h-full grow flex-col bg-white">
                  <NavigationContent />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* Desktop Sidebar (Static) */}
      <aside className="hidden lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white">
        <NavigationContent />
      </aside>
    </>
  )
}