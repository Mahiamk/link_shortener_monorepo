'use client'

import { Fragment } from 'react'
import Link from '../../node_modules/next/link'
import { usePathname } from '../../node_modules/next/navigation'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import {
  Home,
  Users,
  Link as LinkIcon,
  LogOut,
  Mail,
} from 'lucide-react'
import { XMarkIcon } from '@heroicons/react/24/outline'

// 3. ADD THE NEW NAVIGATION ITEM
const navItems = [
  { name: 'Overview', href: '/admin', icon: Home },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Links', href: '/admin/links', icon: LinkIcon },
  { name: 'Submissions', href: '/admin/submissions', icon: Mail }, // <-- NEW
]

// Helper function to conditionally apply CSS classes
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// --- This is the reusable navigation content ---
function NavigationContent() {
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar Header */}
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
        <h2 className="text-lg font-semibold text-indigo-600">
          LinkShorty
          <span className="ml-1.5 rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
            Admin
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="p-4">
          <ul role="list" className="space-y-2">
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
                      'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    )}
                  >
                    <item.icon
                      className={classNames(
                        'h-5 w-5 shrink-0',
                        isActive
                          ? 'text-indigo-600'
                          : 'text-gray-400 group-hover:text-gray-500',
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

      {/* Sidebar Footer (Exit Admin) - This is no longer inside the scroll */}
      <div className="border-t border-gray-200 p-4">
        <Link
          href="/"
          className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-5 w-5 rotate-180 text-gray-400 group-hover:text-gray-500" />
          Exit Admin
        </Link>
      </div>
    </>
  )
}

// --- Main Component ---
export function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}) {
  return (
    <>
      {/* --- Mobile Sidebar (Slide-out) --- */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <TransitionChild
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </TransitionChild>

          <div className="fixed inset-0 flex">
            <TransitionChild
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
                <TransitionChild
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      {/* 4. REPLACED 'MarsIcon' with 'XMarkIcon' */}
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </TransitionChild>
                <div className="flex h-full grow flex-col bg-white">
                  <NavigationContent />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      {/* --- Desktop Sidebar (Static) --- */}
      <aside className="hidden lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
        <div className="flex h-full flex-col">
          <NavigationContent />
        </div>
      </aside>
    </>
  )
}