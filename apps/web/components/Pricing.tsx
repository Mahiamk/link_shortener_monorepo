'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Sparkle, CircleNotch, Lightning } from '@phosphor-icons/react'
import { createCheckoutSession } from '@/lib/api'

const tiers = [
  {
    name: 'Free Starter',
    id: 'free',
    price: { monthly: '$0', annually: '$0' },
    description: 'Perfect for personal use, hobby projects, and quick link testing.',
    features: [
      'Unlimited Short Links',
      'Basic Click Tracking (Total Count)',
      'Link Management Dashboard',
      'Custom Tags & Notes',
      'QR Code Generation',
      'User-level Analytics Modal',
    ],
    highlight: false,
    cta: 'Get Started Free',
    href: '/signup',
  },
  {
    name: 'Pro',
    id: 'pro',
    price: { monthly: '$9', annually: '$99' },
    description: 'Advanced analytics, deep audience breakdowns, and professional branding.',
    features: [
      'Everything in Starter, PLUS:',
      'Aggregated Traffic Trends Over Time',
      'Device, Browser & Geographic Breakdowns',
      'Referral Source Intelligence',
      'Interactive D3 Sparklines & Deep Stats',
      'Priority Email & Community Support',
    ],
    highlight: true,
    cta: 'Upgrade to Pro',
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    price: { monthly: '$49', annually: '$499' },
    description: 'For high-volume campaigns, commercial agencies, and custom requirements.',
    features: [
      'Everything in Pro, PLUS:',
      'Full API Access & Webhooks',
      'Multi-User Team Management',
      'Extended Retention & Raw Data Export',
      'Dedicated SLA & 24/7 Account Manager',
    ],
    highlight: false,
    cta: 'Choose Enterprise',
  },
]

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Pricing() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  const handleSelectTier = async (tierId: string) => {
    if (tierId === 'free') {
      router.push('/signup')
      return
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push(`/signup?plan=${tierId}`)
      return
    }

    setLoadingTier(tierId)
    try {
      const res = await createCheckoutSession(token, tierId as 'pro' | 'enterprise', billingCycle)
      if (res.checkout_url) {
        window.location.href = res.checkout_url
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not initiate Stripe checkout. Please try again.')
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <div id="pricing-section" className="bg-[#f8fafc] py-24 sm:py-32 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            <Sparkle weight="duotone" className="h-3.5 w-3.5" />
            Simple Transparent Pricing
          </span>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Start Free, Scale as You Grow
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
            Every plan includes our lightning-fast URL shortening engine. Upgrade to Pro for deep audience analytics and full insights.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 flex justify-center">
            <div className="relative flex items-center rounded-xl bg-slate-200/70 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={classNames(
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                  'rounded-lg px-4 py-1.5 text-xs font-semibold transition-all'
                )}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annually')}
                className={classNames(
                  billingCycle === 'annually'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                  'rounded-lg px-4 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5'
                )}
              >
                Annual billing
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="isolate mx-auto mt-12 grid max-w-md grid-cols-1 gap-y-8 sm:mt-16 lg:max-w-6xl lg:grid-cols-3 lg:gap-x-8">
          {tiers.map((tier) => {
            const isHighlighted = tier.highlight
            const isLoading = loadingTier === tier.id

            return (
              <div
                key={tier.id}
                className={classNames(
                  isHighlighted
                    ? 'ring-2 ring-indigo-600 shadow-xl shadow-indigo-500/10 bg-white relative'
                    : 'ring-1 ring-slate-200/80 bg-white/90 shadow-xs',
                  'rounded-3xl p-8 transition-all hover:shadow-lg flex flex-col justify-between'
                )}
              >
                {isHighlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1">
                    <Lightning weight="fill" className="h-3 w-3" />
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">{tier.description}</p>
                  
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                      {tier.price[billingCycle]}
                    </span>
                    {tier.price[billingCycle] !== '$0' && (
                      <span className="text-xs font-medium text-slate-500">
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleSelectTier(tier.id)}
                    disabled={isLoading}
                    className={classNames(
                      isHighlighted
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200',
                      'mt-6 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-center text-xs font-bold transition-all disabled:opacity-60'
                    )}
                  >
                    {isLoading ? (
                      <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
                    ) : null}
                    <span>{tier.cta}</span>
                  </button>

                  <ul role="list" className="mt-8 space-y-3 text-xs leading-6 text-slate-600">
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
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}