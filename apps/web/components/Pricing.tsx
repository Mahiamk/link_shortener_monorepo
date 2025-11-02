'use client'

import { CheckIcon } from 'lucide-react'
import Link from 'next/link'

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
    href: '#',
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
    href: '#',
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
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">
            Pricing
          </h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Start Free, Scale Smart.
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          We offer a powerful **Free Starter** plan with no time limits. When your needs grow, our advanced tiers are ready for you.
        </p>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:max-w-4xl lg:grid-cols-3 lg:gap-x-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.highlight ? 'ring-2 ring-indigo-600' : 'ring-1 ring-gray-200',
                'rounded-3xl p-8 shadow-xl transition hover:shadow-2xl bg-white flex flex-col',
              )}
            >
              <h3
                id={tier.id}
                className={classNames(
                  tier.highlight ? 'text-indigo-600' : 'text-gray-900',
                  'text-lg font-semibold leading-8',
                )}
              >
                {tier.name}
              </h3>
              <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {tier.price.monthly}
                </span>
                {tier.price.monthly !== 'Free' && tier.price.monthly !== 'Custom' ? (
                  <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                ) : null}
              </p>
              <Link
                href={tier.href}
                aria-describedby={tier.id}
                className={classNames(
                  tier.highlight
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-200 hover:ring-gray-300 focus-visible:outline-gray-900',
                  'mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50',
                )}
              >
                {tier.id === 'tier-free' ? 'Get Started for Free' : 'Learn More'}
              </Link>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600 flex-grow">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                    {feature}
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