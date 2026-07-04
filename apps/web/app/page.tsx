'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header/page'
import { Features } from '@/components/features'
import { Pricing } from '@/components/Pricing'
import { Footer } from '@/components/Footer'
import { publicShortenUrl, getPublicStats } from '@/lib/api'
import {
  ArrowRight,
  Link as LinkIcon,
  Copy,
  CopyCheck,
  QrCode,
  BarChart2,
  Lock,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
  Zap,
  Globe,
} from 'lucide-react'

type LoginGate = 'qr' | 'analytics' | null

const TRUST_BADGES = [
  'No credit card required',
  'Free forever plan',
  'Instant results',
]

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K+`
  return n.toString()
}

export default function Homepage() {
  const [url, setUrl]             = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState<{ short_code: string } | null>(null)
  const [copied, setCopied]       = useState(false)
  const [stats, setStats]         = useState<{ total_links: number; total_clicks: number } | null>(null)

  useEffect(() => {
    getPublicStats().then(setStats).catch(() => {/* show nothing on error */})
  }, [])
  const [gate, setGate]           = useState<LoginGate>(null)

  const BASE_URL   = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
  const shortUrl   = result ? `${BASE_URL}/${result.short_code}` : ''
  const displayUrl = result ? `${BASE_URL.replace(/^https?:\/\//, '')}/${result.short_code}` : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setIsLoading(true); setError(''); setResult(null); setGate(null)
    try {
      const data = await publicShortenUrl(url.trim())
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (!shortUrl) return
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleReset = () => {
    setResult(null); setUrl(''); setError(''); setGate(null); setCopied(false)
  }

  const toggleGate = (type: 'qr' | 'analytics') => setGate(g => g === type ? null : type)

  return (
    <div className="bg-[#c3bfc7]">
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative isolate min-h-screen overflow-hidden">

        {/* Dot-grid background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: 'radial-gradient(rgba(22,8,36,0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ambient glow orbs */}
        <div aria-hidden className="pointer-events-none absolute -top-52 left-1/2 -z-10 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 -right-64 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-700/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute top-1/2 -left-64 -z-10 h-[500px] w-[500px] rounded-full bg-violet-900/20 blur-3xl" />

        <div className="mx-auto max-w-4xl px-6 pb-24 pt-36 text-center lg:pt-48">

          {/* Badge pill */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#223030]/25 bg-[#223030]/10 px-4 py-1.5 text-sm font-medium text-[#223030]">
            <Sparkles className="h-3.5 w-3.5" />
            Free · Instant · No sign-up needed to try
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-[#160824] sm:text-6xl lg:text-7xl">
            Shorten. Share.
            <br />
            <span className="bg-linear-to-r from-violet-700 via-fuchsia-700 to-indigo-700 bg-clip-text text-transparent">
              Track Everything.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#160824]/65 sm:text-xl">
            Turn any long URL into a powerful short link in seconds —
            no account needed. Unlock analytics, custom QR codes, and more when you sign up free.
          </p>

          {/* ── URL Box ── */}
          <div className="mx-auto mt-12 max-w-2xl">
            {!result ? (
              /* Input form */
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste your long URL here…"
                      required
                      className="w-full rounded-2xl border border-[#160824]/15 bg-white/50 py-4 pl-11 pr-4 text-[#160824] placeholder:text-[#160824]/40 backdrop-blur-sm transition-all focus:border-[#223030]/40 focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#223030]/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !url.trim()}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#223030] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#223030]/30 transition-all hover:bg-[#2e4040] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><span>Shorten</span><ArrowRight className="h-4 w-4" /></>
                    }
                  </button>
                </div>

                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

                {/* Trust badges */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                  {TRUST_BADGES.map(b => (
                    <span key={b} className="flex items-center gap-1.5 text-xs text-[#160824]/50">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      {b}
                    </span>
                  ))}
                </div>
              </form>

            ) : (
              /* Result card */
              <div className="overflow-hidden rounded-2xl border border-[#160824]/12 bg-white/60 text-left backdrop-blur-sm">

                {/* Card header */}
                <div className="flex items-center justify-between border-b border-[#160824]/10 px-5 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Your link is ready!
                  </div>
                  <button onClick={handleReset} className="text-[#160824]/40 transition-colors hover:text-[#160824]">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Short URL row */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <span className="flex-1 truncate font-mono text-sm font-semibold text-violet-700">
                    {displayUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#160824]/12 bg-white/70 px-4 py-2 text-sm font-medium text-[#160824] transition-colors hover:bg-white/90"
                  >
                    {copied
                      ? <CopyCheck className="h-4 w-4 text-emerald-400" />
                      : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 border-t border-[#160824]/10 px-5 py-4">
                  {/* QR gate */}
                  <button
                    onClick={() => toggleGate('qr')}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                      gate === 'qr'
                        ? 'border-[#223030]/40 bg-[#223030]/12 text-[#223030]'
                        : 'border-[#160824]/12 bg-white/50 text-[#160824]/70 hover:border-[#223030]/30 hover:text-[#160824]'
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5 text-[#223030]/60" />
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </button>

                  {/* Analytics gate */}
                  <button
                    onClick={() => toggleGate('analytics')}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                      gate === 'analytics'
                        ? 'border-[#223030]/40 bg-[#223030]/12 text-[#223030]'
                        : 'border-[#160824]/12 bg-white/50 text-[#160824]/70 hover:border-[#223030]/30 hover:text-[#160824]'
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5 text-[#223030]/60" />
                    <BarChart2 className="h-4 w-4" />
                    Analytics
                  </button>

                  <div className="flex-1" />

                  <a
                    href="/signup"
                    className="flex items-center gap-1.5 rounded-xl bg-[#223030] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2e4040]"
                  >
                    Save this link <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Login-gate callout */}
                {gate && (
                  <div className="border-t border-[#223030]/15 bg-[#223030]/8 px-5 py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#160824]">
                          {gate === 'qr'
                            ? '🎨 Custom QR Codes require a free account'
                            : '📊 Link Analytics require a free account'}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#160824]/60">
                          {gate === 'qr'
                            ? 'Generate branded QR codes with custom colors, download in HD, and embed your logo.'
                            : 'See real-time clicks, countries, devices, browsers, and referrers for every link you create.'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <a
                          href="/login"
                          className="rounded-lg border border-[#160824]/15 px-3.5 py-2 text-xs font-medium text-[#160824]/70 transition-colors hover:text-[#160824]"
                        >
                          Log in
                        </a>
                        <a
                          href="/signup"
                          className="rounded-lg bg-[#223030] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2e4040]"
                        >
                          Sign up free →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-20 grid max-w-lg grid-cols-3 gap-6 border-t border-[#160824]/10 pt-12 sm:max-w-2xl sm:gap-12">
            <div>
              <p className="text-3xl font-extrabold text-[#160824] sm:text-4xl">
                {stats ? formatCount(stats.total_links) : '…'}
              </p>
              <p className="mt-1 text-sm text-[#160824]/50">Links shortened</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#160824] sm:text-4xl">
                {stats ? formatCount(stats.total_clicks) : '…'}
              </p>
              <p className="mt-1 text-sm text-[#160824]/50">Clicks tracked</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#160824] sm:text-4xl">100%</p>
              <p className="mt-1 text-sm text-[#160824]/50">Free to use</p>
            </div>
          </div>
        </div>

        {/* Feature chips floating at bottom of hero */}
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3 px-6 pb-16">
          {[
            { icon: Zap,      text: 'Instant shortening'   },
            { icon: BarChart2, text: 'Real-time analytics'  },
            { icon: QrCode,   text: 'Custom QR codes'       },
            { icon: Globe,    text: 'Global CDN redirects'  },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 rounded-full border border-[#160824]/12 bg-white/40 px-4 py-2 text-sm text-[#160824]/60 backdrop-blur-sm"
            >
              <Icon className="h-3.5 w-3.5 text-[#223030]" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ── Rest of page (light background) ──────────────────────────── */}
      <div className="bg-[#c3bfc7]">
        <div id="features-section" className="scroll-mt-16">
          <Features />
        </div>
        <div id="pricing-section" className="scroll-mt-16">
          <Pricing />
        </div>
        <Footer />
      </div>
    </div>
  )
}
