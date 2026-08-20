'use client'

import Link from 'next/link'
import {
  LinkSimple,
  GithubLogo,
  TwitterLogo,
  LinkedinLogo,
} from '@phosphor-icons/react'

const navLinks = [
  { name: 'Features', href: '/#features-section' },
  { name: 'Pricing', href: '/#pricing-section' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  { name: 'Privacy Policy', href: '#' },
  { name: 'Terms of Service', href: '#' },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500 py-8 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-xs">
            <LinkSimple weight="duotone" className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            LinkShorty
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            · Fast, secure link shortening & analytics
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="hover:text-indigo-600 transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Socials & Copyright */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="hover:text-slate-700 transition-colors"
            >
              <GithubLogo weight="duotone" className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
              className="hover:text-slate-700 transition-colors"
            >
              <TwitterLogo weight="duotone" className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="hover:text-slate-700 transition-colors"
            >
              <LinkedinLogo weight="duotone" className="h-4 w-4" />
            </a>
          </div>
          <span className="text-slate-300">|</span>
          <span>&copy; {new Date().getFullYear()} LinkShorty</span>
        </div>
      </div>
    </footer>
  )
}