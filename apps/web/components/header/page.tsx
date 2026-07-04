'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Features', href: '/#features-section' },
  { name: 'Pricing', href: '/#pricing-section' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 shadow-sm">
        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
      </div>
      <span className="text-base font-bold text-[#160824] tracking-tight">LinkShorty</span>
    </div>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-4 left-4 right-4 z-50">
      <div className="mx-auto max-w-6xl">
        <nav className="relative flex items-center justify-between rounded-full border border-[#160824]/15 bg-[#c3bfc7]/50 px-5 py-2.5 shadow-xl shadow-[#160824]/10 backdrop-blur-xl lg:px-6">

          {/* Mirror shimmer — thin highlight line along the top edge */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 top-0 h-px rounded-full bg-linear-to-r from-transparent via-[#160824]/15 to-transparent"
          />

          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex lg:gap-x-7">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-[#160824] transition-colors hover:text-[#223030]"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#160824] transition-colors hover:text-[#223030]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#223030] px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2e4040]"
            >
              Get started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-full p-2.5 text-[#160824] lg:hidden"
          >
            <span className="sr-only">Open menu</span>
            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </div>

      {/* Mobile drawer */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-[#c3bfc7] px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-[#160824]/10">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Logo />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-[#160824]/50 hover:text-[#160824]"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-8 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-3 py-3 text-base font-medium text-[#160824] transition-colors hover:bg-[#160824]/5 hover:text-[#223030]"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-[#160824]/10 pt-6">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-3 text-base font-medium text-[#160824] transition-colors hover:bg-[#160824]/5 hover:text-[#223030]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl bg-[#223030] px-3 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-[#2e4040]"
            >
              Get started free →
            </Link>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}
