'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header/page'
import { Features } from '@/components/features'
import { Pricing } from '@/components/Pricing'
import { Footer } from '@/components/Footer'
import { publicShortenUrl, getPublicStats } from '@/lib/api'
import { D3Sparkline } from '@/components/charts/D3Sparkline'
import {
  LinkSimple,
  Copy,
  CheckCircle,
  QrCode,
  ShareNetwork,
  ArrowClockwise,
  ArrowRight,
  Sparkle,
  ChartLineUp,
  CircleNotch,
  ShieldCheck,
  Lightning,
  Globe,
  LockKey,
} from '@phosphor-icons/react'

export default function Homepage() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ short_code: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(true)
  const [stats, setStats] = useState<{ total_links: number; total_clicks: number } | null>(null)

  useEffect(() => {
    getPublicStats()
      .then(setStats)
      .catch(() => {
        // Mock fallback if offline
        setStats({ total_links: 1420, total_clicks: 89300 })
      })
  }, [])

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://backend-api-8zck.onrender.com'
  const shortUrl = result ? `${BASE_URL}/${result.short_code}` : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setIsLoading(true)
    setError('')
    setResult(null)
    setShowQr(true)

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

  const handleShare = async () => {
    if (!shortUrl) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Short link', url: shortUrl })
      } catch (err) {
        if ((err as DOMException).name !== 'AbortError') handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  const handleReset = () => {
    setResult(null)
    setUrl('')
    setError('')
    setCopied(false)
  }

  // Sample sparkline series for hero stats
  const sparklineData = [12, 18, 14, 25, 32, 28, 42, 48, 55, 62, 59, 74, 88]

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Header />

      {/* ── Hero Section (matching home.png) ─────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-32">
        {/* Soft Ambient Pastel Glow Orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-indigo-200/40 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/4 -right-48 -z-10 h-[500px] w-[500px] rounded-full bg-purple-200/30 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/3 -left-48 -z-10 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-[100px]"
        />

        <div className="mx-auto max-w-5xl px-6 text-center">
          {/* Announcement pill */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition hover:border-indigo-200 hover:text-indigo-600">
            <span>Announcing my telegram channel where I share about Tech.</span>
            <span className="font-semibold text-indigo-600 inline-flex items-center gap-1">
              Join <ArrowRight weight="bold" className="h-3 w-3" />
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl leading-[1.15]">
            Shorten links to enhance <br className="hidden sm:inline" />
            <span className="text-indigo-600">online sharing</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Our link shortener compacts long URLs for easy sharing across platforms,
            with click tracking, custom aliases, audience insights, and seamless integration.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="#shortener-box"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95"
            >
              Get started
            </a>
            <a
              href="#features-section"
              className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:text-indigo-600"
            >
              <span>Learn more</span>
              <ArrowRight weight="bold" className="h-4 w-4" />
            </a>
          </div>

          {/* ── URL Shortener Box / Result (matching sample.png) ────────── */}
          <div id="shortener-box" className="mx-auto mt-12 max-w-2xl text-left">
            {!result ? (
              /* Input State */
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-3 sm:p-4 shadow-xl shadow-slate-200/40 backdrop-blur">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <LinkSimple
                      weight="duotone"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste your long URL here..."
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !url.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
                        <span>Shortening...</span>
                      </>
                    ) : (
                      <>
                        <Sparkle weight="duotone" className="h-4 w-4" />
                        <span>Shorten URL</span>
                      </>
                    )}
                  </button>
                </form>

                {error && (
                  <p className="mt-3 text-xs font-medium text-rose-600 px-2">{error}</p>
                )}

                {/* Sub-features list below input */}
                <div className="mt-3.5 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 px-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Lightning weight="duotone" className="h-3.5 w-3.5 text-amber-500" />
                    Instant redirect
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck weight="duotone" className="h-3.5 w-3.5 text-emerald-500" />
                    Safe & spam-protected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ChartLineUp weight="duotone" className="h-3.5 w-3.5 text-indigo-500" />
                    Free basic analytics
                  </span>
                </div>
              </div>
            ) : (
              /* Success / Result State matching sample.png */
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 transition-all">
                {/* Original URL row */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Original URL
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={url}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm text-slate-600 outline-none"
                  />
                </div>

                {/* Your Short Link row */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Your Short Link
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={shortUrl}
                      className="w-full rounded-xl border border-slate-200 bg-indigo-50/30 px-4 py-3 text-sm font-semibold text-indigo-600 pr-24 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="absolute right-2 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                      {copied ? (
                        <>
                          <CheckCircle weight="duotone" className="h-4 w-4 text-emerald-500" />
                          <span className="text-emerald-600 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy weight="duotone" className="h-4 w-4 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Action buttons row */}
                <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-5 gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowQr(!showQr)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors border ${
                        showQr
                          ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode weight="duotone" className="h-4 w-4" />
                      <span>QR Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <ShareNetwork weight="duotone" className="h-4 w-4" />
                      <span>Share</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    <ArrowClockwise weight="duotone" className="h-4 w-4" />
                    <span>Shorten Another</span>
                  </button>
                </div>

                {/* Embedded QR Code Card (as in sample.png) */}
                {showQr && (
                  <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6 text-center">
                    <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl bg-white p-3 shadow-sm border border-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                          shortUrl
                        )}&qzone=1&margin=0&color=0f172a`}
                        alt="QR Code"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <p className="mt-4 text-xs font-medium text-slate-500">
                      Scan this code to visit the link
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Live Stats Sparkline Banner ────────────────────────────── */}
          {stats && (
            <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-sm backdrop-blur flex items-center justify-between gap-6">
              <div className="text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Global Link Activity
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">
                    {stats.total_clicks?.toLocaleString() || '10,000+'}
                  </span>
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                    <ChartLineUp weight="bold" className="h-3.5 w-3.5" />
                    +18% this week
                  </span>
                </div>
              </div>

              {/* D3 Sparkline */}
              <div className="shrink-0">
                <D3Sparkline
                  data={sparklineData}
                  width={140}
                  height={40}
                  color="#4f46e5"
                  showMinMax
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Features Section ────────────────────────────────────────── */}
      <div id="features-section">
        <Features />
      </div>

      {/* ── Pricing Section ─────────────────────────────────────────── */}
      <div id="pricing-section">
        <Pricing />
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}
