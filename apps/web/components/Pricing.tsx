'use client'

import Link from 'next/link'
import { CheckCircle, Sparkle } from '@phosphor-icons/react'

const tiers = [
  {
    name: 'Free Starter',
    id: 'tier-free',
    href: '/signup',
    price: { monthly: 'Free', annually: 'Free' },
    description: 'Perfect for personal use, hobby projects, and testing.',
    features: [
      'Unlimited Short Links',
      'Basic Click Tracking (Total Count)',
      'Link Management Dashboard',
      'Custom Tags & Notes',
      'QR Code Generation',
      'User-level Analytics Modal',
    ],
    highlight: true,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '/signup',
    price: { monthly: '$9', annually: '$99' },
    description: 'Advanced analytics, deeper audience insights, and professional tools.',
    features: [
      'Everything in Starter, PLUS:',
      'Aggregated Clicks Over Time',
      'Overall Device & Referrer Analysis',
      'Custom Short Domains (CNAME)',
      'A/B Testing (Coming Soon)',
      'Priority Support',
    ],
    highlight: false,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '/contact',
    price: { monthly: 'Custom', annually: 'Custom' },
    description: 'For high-volume traffic, large teams, and full API integration.',
    features: [
      'Unlimited everything',
      'Full API Access & Webhooks',
      'Team Management (5+ seats)',
      'Custom Geotargeting',
      'SLA & Dedicated Account Manager',
    ],
    highlight: false,
  },
]

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Pricing() {
  return (
    <div className="bg-[#f8fafc] py-24 sm:py-32 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            <Sparkle weight="duotone" className="h-3.5 w-3.5" />
            Simple Pricing
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Start Free, Scale Smart
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            We offer a full-featured Free plan with no credit card required.
            Upgrade whenever your audience and campaign needs expand.
          </p>
        </div>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:max-w-6xl lg:grid-cols-3 lg:gap-x-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.highlight
                  ? 'ring-2 ring-indigo-600 shadow-xl shadow-indigo-500/10 bg-white relative'
                  : 'ring-1 ring-slate-200 bg-white/80 shadow-sm',
                'rounded-3xl p-8 transition-all hover:shadow-lg flex flex-col',
              )}
            >
              {tier.highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                  Most Popular
                </span>
              )}

              <div className="flex items-center justify-between">
                <h3
                  id={tier.id}
                  className="text-lg font-bold leading-8 text-slate-900"
                >
                  {tier.name}
                </h3>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">{tier.description}</p>
              
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                  {tier.price.monthly}
                </span>
                {tier.price.monthly !== 'Free' && tier.price.monthly !== 'Custom' ? (
                  <span className="text-xs font-medium text-slate-500">/month</span>
                ) : null}
              </p>

              <Link
                href={tier.href}
                aria-describedby={tier.id}
                className={classNames(
                  tier.highlight
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200',
                  'mt-6 block rounded-xl py-2.5 px-4 text-center text-sm font-semibold transition-colors',
                )}
              >
                {tier.id === 'tier-free' ? 'Get Started Free' : 'Choose ' + tier.name}
              </Link>

              <ul role="list" className="mt-8 space-y-3 text-xs leading-6 text-slate-600 grow">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-x-2.5">
                    <CheckCircle
                      weight="duotone"
                      className="h-4 w-4 shrink-0 text-indigo-600 mt-1"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}