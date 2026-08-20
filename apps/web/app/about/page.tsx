'use client'

import { Lightning, ChartLineUp, ShieldCheck, Users, Sparkle } from '@phosphor-icons/react'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header/page'
import { Footer } from '@/components/Footer'
import app from '@/public/images/app.png'

const values = [
  {
    name: 'Simplicity & Speed',
    description:
      'We believe powerful tools should be fast and easy to use. Our interface is designed to be minimal, intuitive, and incredibly quick, getting you from a long URL to a short link in seconds.',
    icon: Lightning,
  },
  {
    name: 'Data-Driven Insights',
    description:
      'A short link is just the beginning. We empower you with the analytics to understand your audience—who they are, where they come from, and what they click—all in a clear, simple dashboard.',
    icon: ChartLineUp,
  },
  {
    name: 'Privacy & Security',
    description:
      'Trust is paramount. We are committed to protecting your data and the privacy of your visitors. We provide secure links and give you full control over your data and link activity.',
    icon: ShieldCheck,
  },
  {
    name: 'Open & Accessible',
    description:
      'Our goal is to provide a world-class tool that is accessible to everyone. We started with a powerful free tier and are committed to building a platform that scales with you, from a personal project to a global enterprise.',
    icon: Users,
  },
]

export default function AboutPage() {
  return (
    <div className="bg-[#f8fafc] text-slate-900 min-h-screen">
      <Header />
      <main className="isolate pt-28 sm:pt-36">
        {/* Hero */}
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700">
              <Sparkle weight="duotone" className="h-3.5 w-3.5" />
              Our Story
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              From Idea to Impact
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              In a digital world cluttered with long, complex, and untrackable links, our mission is to provide a simple, powerful, and insightful tool for everyone.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4 text-sm leading-relaxed text-slate-600">
              <p>
                LinkShorty started as a simple idea: &quot;Why is it still so hard to share links that are not only short, but also meaningful?&quot; We were tired of clunky, generic shorteners that offered no data and no control. We wanted a tool that was fast, reliable, and packed with the analytics that marketers, creators, and businesses need.
              </p>
              <p>
                What began as a personal project quickly grew into a robust platform focused on a single goal: turning every shared link into an asset. We&apos;re dedicated to building a service that is both powerful for professionals and accessible for everyone.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50">
                <Image src={app} alt="App Preview" className="rounded-xl object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="bg-white py-20 border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                The Principles That Guide Us
              </h2>
            </div>
            <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
              <dl className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {values.map((v) => (
                  <div
                    key={v.name}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6"
                  >
                    <dt className="flex items-center gap-3 text-base font-bold text-slate-900">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <v.icon weight="duotone" className="h-5 w-5" />
                      </div>
                      {v.name}
                    </dt>
                    <dd className="mt-3 text-xs leading-6 text-slate-600">
                      {v.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-3xl bg-indigo-600 px-6 py-16 text-center text-white shadow-xl sm:px-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to shorten your first link?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-indigo-100">
              Get started for free today. No credit card required, just simple, powerful link management.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/signup"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-md hover:bg-slate-50 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}