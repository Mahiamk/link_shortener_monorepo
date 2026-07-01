'use client'

import { useState } from 'react'
import { createLink, Link as LinkType } from '@/lib/api'
import {
  LinkIcon,
  Plus,
  Loader2,
  ClipboardIcon,
  Share2Icon,
  QrCodeIcon,
  CopyCheck,
  DownloadIcon,
  Pipette,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react'
import ArrowUturnLeftIcon from '@heroicons/react/24/solid/esm/ArrowUturnLeftIcon'

interface UrlShortenerProps {
  onLinkCreated: (newLink: LinkType) => void
}

// ─── QR color presets ────────────────────────────────────────────────────────

interface ColorPreset {
  name: string
  fg: string   // hex without #
  bg: string
}

const PRESETS: ColorPreset[] = [
  { name: 'Classic',  fg: '000000', bg: 'FFFFFF' },
  { name: 'Violet',   fg: '7C3AED', bg: 'F5F3FF' },
  { name: 'Ocean',    fg: '0369A1', bg: 'E0F2FE' },
  { name: 'Rose',     fg: 'BE123C', bg: 'FFF1F2' },
  { name: 'Emerald',  fg: '065F46', bg: 'ECFDF5' },
  { name: 'Slate',    fg: '1E293B', bg: 'F1F5F9' },
  { name: 'Night',    fg: 'F8FAFC', bg: '0F172A' },
  { name: 'Amber',    fg: '92400E', bg: 'FFFBEB' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inputToHex(value: string) {
  return value.replace('#', '').toUpperCase()
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UrlShortener({ onLinkCreated }: UrlShortenerProps) {
  const [longUrl, setLongUrl] = useState('')
  const [tag, setTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdLink, setCreatedLink] = useState<LinkType | null>(null)
  const [showQrCode, setShowQrCode] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // QR color state
  const [selectedPreset, setSelectedPreset] = useState<number>(0) // index into PRESETS
  const [showCustom, setShowCustom] = useState(false)
  const [customFg, setCustomFg] = useState('#000000')
  const [customBg, setCustomBg] = useState('#FFFFFF')

  const isCustomActive = selectedPreset === -1

  // Resolved colors
  const activeFg = isCustomActive ? inputToHex(customFg) : PRESETS[selectedPreset].fg
  const activeBg = isCustomActive ? inputToHex(customBg) : PRESETS[selectedPreset].bg

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  const fullShortUrl = createdLink ? `${BASE_URL}/${createdLink.short_code}` : ''
  const qrCodeUrl = createdLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullShortUrl)}&qzone=1&margin=10&color=${activeFg}&bgcolor=${activeBg}`
    : ''

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!longUrl) { setError('Please enter a URL.'); return }
    const token = localStorage.getItem('token')
    if (!token) { setError('You are not logged in.'); return }
    setIsLoading(true); setError(''); setShowQrCode(false); setIsCopied(false)
    try {
      const newLink = await createLink(longUrl, token, tag || undefined)
      setCreatedLink(newLink)
      onLinkCreated(newLink)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    if (!fullShortUrl) return
    navigator.clipboard.writeText(fullShortUrl).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  const handleShare = async () => {
    if (fullShortUrl && navigator.share) {
      try {
        await navigator.share({ title: 'Short link', url: fullShortUrl })
      } catch (err) {
        if ((err as DOMException).name !== 'AbortError') handleCopy()
      }
    } else if (fullShortUrl) {
      handleCopy()
    }
  }

  const handleShortenAnother = () => {
    setCreatedLink(null); setLongUrl(''); setTag(''); setShowQrCode(false)
    setIsCopied(false); setError(''); setIsDownloading(false)
    setSelectedPreset(0); setShowCustom(false)
    setCustomFg('#000000'); setCustomBg('#FFFFFF')
  }

  const handleDownloadQr = async () => {
    if (!qrCodeUrl || !createdLink) return
    setIsDownloading(true)
    try {
      // Fetch the QR image as a blob so canvas can draw it without CORS issues
      const res = await fetch(qrCodeUrl)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const imgObjectUrl = URL.createObjectURL(blob)

      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imgObjectUrl
      })

      // Canvas layout
      const qrSize   = 300
      const padH     = 28   // horizontal padding around QR
      const padV     = 24   // vertical padding above/below QR
      const footerH  = 64   // height of branding footer
      const canvasW  = qrSize + padH * 2
      const canvasH  = padV + qrSize + padV + footerH

      const canvas = document.createElement('canvas')
      canvas.width  = canvasW
      canvas.height = canvasH
      const ctx = canvas.getContext('2d')!

      // QR background (matches selected theme)
      ctx.fillStyle = `#${activeBg}`
      ctx.fillRect(0, 0, canvasW, padV + qrSize + padV)

      // Draw QR image centered
      ctx.drawImage(img, padH, padV, qrSize, qrSize)
      URL.revokeObjectURL(imgObjectUrl)

      // Branding footer background
      const footerY = padV + qrSize + padV
      ctx.fillStyle = '#F5F3FF'
      ctx.fillRect(0, footerY, canvasW, footerH)

      // Thin divider
      ctx.strokeStyle = '#DDD6FE'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, footerY)
      ctx.lineTo(canvasW, footerY)
      ctx.stroke()

      // Branding text — line 1
      ctx.textAlign = 'center'
      ctx.fillStyle = '#6B7280'
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText('Ad-free QR codes & short links — try it free:', canvasW / 2, footerY + 22)

      // Branding text — line 2 (URL, bold violet)
      ctx.fillStyle = '#7C3AED'
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.fillText('linkyshorty.vercel.app', canvasW / 2, footerY + 44)

      // Export canvas → download
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { alert('Failed to generate image.'); return }
        const url = URL.createObjectURL(pngBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qr-${createdLink.short_code}.png`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 'image/png')

    } catch {
      alert('Failed to download QR code.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSelectPreset = (index: number) => {
    setSelectedPreset(index)
    setShowCustom(false)
  }

  const handleSelectCustom = () => {
    setSelectedPreset(-1)
    setShowCustom(true)
  }

  const handleResetCustom = () => {
    setCustomFg('#000000')
    setCustomBg('#FFFFFF')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/70">
      {!createdLink ? (
        // ── Form view ──
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="longUrl" className="mb-1.5 block text-sm font-medium text-gray-700">
              Paste your long URL
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <LinkIcon className="h-4 w-4 text-gray-400" />
              </span>
              <input
                type="url" id="longUrl"
                placeholder="https://example.com/a-very-long-url-to-shorten"
                value={longUrl} onChange={(e) => setLongUrl(e.target.value)} required
                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="tag" className="mb-1.5 block text-sm font-medium text-gray-700">
                Tag <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text" id="tag"
                placeholder="e.g., Marketing Campaign"
                value={tag} onChange={(e) => setTag(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all"
              />
            </div>
            <button
              type="submit" disabled={isLoading || !longUrl}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto transition-colors"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isLoading ? 'Shortening…' : 'Shorten URL'}
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>

      ) : (
        // ── Result view ──
        <div className="space-y-5">
          {/* Original URL */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400">Original URL</label>
            <p className="truncate rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
              {createdLink.original_url}
            </p>
          </div>

          {/* Short URL + Copy */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400">Your Short Link</label>
            <div className="flex gap-2">
              <input
                type="text" value={fullShortUrl} readOnly
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-violet-700 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {isCopied ? <CopyCheck className="h-4 w-4 text-emerald-500" /> : <ClipboardIcon className="h-4 w-4" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                showQrCode
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:text-violet-700'
              }`}
            >
              <QrCodeIcon className="h-4 w-4" />
              QR Code
              {showQrCode ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:border-violet-300 hover:text-violet-700 transition-all"
              >
                <Share2Icon className="h-4 w-4" />
                Share
              </button>
            )}

            <div className="flex-1" />

            <button
              onClick={handleShortenAnother}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
              Shorten Another
            </button>
          </div>

          {/* ── QR Code panel ── */}
          {showQrCode && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-start">

                {/* QR Preview */}
                <div
                  className="shrink-0 rounded-2xl p-3 shadow-sm ring-1 ring-gray-200"
                  style={{ backgroundColor: `#${activeBg}` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={qrCodeUrl}
                    src={qrCodeUrl}
                    alt="QR Code"
                    width={160}
                    height={160}
                    className="h-40 w-40 rounded-lg"
                  />
                </div>

                {/* Controls */}
                <div className="flex w-full flex-1 flex-col gap-4">

                  {/* Preset swatches */}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">Color Theme</p>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((preset, i) => {
                        const isActive = !isCustomActive && selectedPreset === i
                        return (
                          <button
                            key={preset.name}
                            onClick={() => handleSelectPreset(i)}
                            title={preset.name}
                            className={`group relative flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 transition-all hover:scale-110 ${
                              isActive ? 'ring-violet-500' : 'ring-transparent hover:ring-gray-300'
                            }`}
                            style={{ backgroundColor: `#${preset.bg}`, border: `2px solid #${preset.fg}33` }}
                          >
                            <span
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: `#${preset.fg}` }}
                            />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                              {preset.name}
                            </span>
                          </button>
                        )
                      })}

                      {/* Custom swatch */}
                      <button
                        onClick={handleSelectCustom}
                        title="Custom colors"
                        className={`group flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 transition-all hover:scale-110 border border-dashed border-gray-300 bg-white ${
                          isCustomActive ? 'ring-violet-500' : 'ring-transparent hover:ring-gray-300'
                        }`}
                      >
                        <Pipette className="h-3.5 w-3.5 text-gray-500" />
                        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Custom
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Custom color pickers */}
                  {showCustom && (
                    <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">Custom Colors</p>
                        <button
                          onClick={handleResetCustom}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-gray-600">Foreground</span>
                          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <input
                              type="color"
                              value={customFg}
                              onChange={(e) => setCustomFg(e.target.value)}
                              className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0 outline-none"
                            />
                            <span className="font-mono text-xs text-gray-600">{customFg.toUpperCase()}</span>
                          </div>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-gray-600">Background</span>
                          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                            <input
                              type="color"
                              value={customBg}
                              onChange={(e) => setCustomBg(e.target.value)}
                              className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0 outline-none"
                            />
                            <span className="font-mono text-xs text-gray-600">{customBg.toUpperCase()}</span>
                          </div>
                        </label>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Tip: make sure there's enough contrast between foreground and background for scanners to read the code.
                      </p>
                    </div>
                  )}

                  {/* Active theme label */}
                  {!showCustom && (
                    <p className="text-xs text-gray-400">
                      Theme: <span className="font-medium text-gray-600">{PRESETS[selectedPreset]?.name ?? 'Classic'}</span>
                      {' · '}
                      <span className="font-mono">#{activeFg}</span> on <span className="font-mono">#{activeBg}</span>
                    </p>
                  )}

                  {/* Download */}
                  <button
                    onClick={handleDownloadQr}
                    disabled={isDownloading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  >
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadIcon className="h-4 w-4" />}
                    {isDownloading ? 'Downloading…' : 'Download QR Code'}
                  </button>

                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
