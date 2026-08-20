'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import {
  LinkSimple,
  List,
  X,
  ArrowRight,
  SignIn,
  UserPlus,
} from '@phosphor-icons/react'

const navigation = [
  { name: 'Features', href: '/#features-section' },
  { name: 'Pricing', href: '/#pricing-section' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-200">
        <LinkSimple weight="duotone" className="h-5 w-5 text-white" />
      </div>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        LinkShorty
      </span>
    </div>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-4 left-4 right-4 z-50">
      <div className="mx-auto max-w-6xl">
        <nav className="relative flex items-center justify-between rounded-full border border-slate-200/80 bg-white/85 px-5 py-2.5 shadow-lg shadow-slate-200/50 backdrop-blur-xl lg:px-7">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-indigo-600"
            >
              <SignIn weight="duotone" className="h-4 w-4 text-indigo-500" />
              <span>Log in</span>
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300"
            >
              <UserPlus weight="duotone" className="h-4 w-4" />
              <span>Get started</span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2 inline-flex items-center justify-center rounded-full p-2 text-slate-600 hover:text-slate-900 lg:hidden"
          >
            <span className="sr-only">Open menu</span>
            <List weight="duotone" className="h-6 w-6" />
          </button>
        </nav>
      </div>

      {/* Mobile drawer */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-slate-200">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Logo />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-xl p-2.5 text-slate-400 hover:text-slate-700"
            >
              <span className="sr-only">Close menu</span>
              <X weight="duotone" className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-8 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3.5 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <SignIn weight="duotone" className="h-4 w-4 text-indigo-600" />
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
            >
              <span>Get started free</span>
              <ArrowRight weight="duotone" className="h-4 w-4" />
            </Link>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}
