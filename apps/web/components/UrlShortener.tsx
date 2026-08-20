'use client'

import { useState } from 'react'
import { createLink, Link as LinkType } from '@/lib/api'
import {
  LinkSimple,
  Plus,
  CircleNotch,
  Copy,
  CheckCircle,
  ShareNetwork,
  QrCode,
  DownloadSimple,
  ArrowClockwise,
  Tag,
  Palette,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react'

interface UrlShortenerProps {
  onLinkCreated: (newLink: LinkType) => void
}

interface ColorPreset {
  name: string
  fg: string // hex without #
  bg: string
}

const PRESETS: ColorPreset[] = [
  { name: 'Classic', fg: '0F172A', bg: 'FFFFFF' },
  { name: 'Indigo', fg: '4F46E5', bg: 'EEF2FF' },
  { name: 'Ocean', fg: '0284C7', bg: 'F0F9FF' },
  { name: 'Rose', fg: 'E11D48', bg: 'FFF1F2' },
  { name: 'Emerald', fg: '059669', bg: 'ECFDF5' },
  { name: 'Slate', fg: '334155', bg: 'F8FAFC' },
]

function inputToHex(value: string) {
  return value.replace('#', '').toUpperCase()
}

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
  const [selectedPreset, setSelectedPreset] = useState<number>(0)
  const [showCustom, setShowCustom] = useState(false)
  const [customFg, setCustomFg] = useState('#0f172a')
  const [customBg, setCustomBg] = useState('#ffffff')

  const isCustomActive = selectedPreset === -1
  const activeFg = isCustomActive ? inputToHex(customFg) : PRESETS[selectedPreset].fg
  const activeBg = isCustomActive ? inputToHex(customBg) : PRESETS[selectedPreset].bg

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
  const fullShortUrl = createdLink ? `${BASE_URL}/${createdLink.short_code}` : ''
  const qrCodeUrl = createdLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        fullShortUrl
      )}&qzone=1&margin=10&color=${activeFg}&bgcolor=${activeBg}`
    : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!longUrl) {
      setError('Please enter a URL.')
      return
    }
    const token = localStorage.getItem('token')
    if (!token) {
      setError('You are not logged in.')
      return
    }
    setIsLoading(true)
    setError('')
    setShowQrCode(false)
    setIsCopied(false)
    try {
      const newLink = await createLink(longUrl, token, tag || undefined)
      setCreatedLink(newLink)
      onLinkCreated(newLink)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the link.')
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
    setCreatedLink(null)
    setLongUrl('')
    setTag('')
    setShowQrCode(false)
    setError('')
  }

  const handleDownloadQr = async () => {
    if (!qrCodeUrl || !createdLink) return
    setIsDownloading(true)
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `qr-${createdLink.short_code}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (e) {
      console.error(e)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all">
      {!createdLink ? (
        /* Form view matching user.png */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="long-url" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enter your long URL
            </label>
            <div className="relative">
              <LinkSimple
                weight="duotone"
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              />
              <input
                id="long-url"
                type="url"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="https://example.com/a-very-long-url-to-shorten"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="tag" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tag (Optional)
              </label>
              <div className="relative">
                <Tag
                  weight="duotone"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="tag"
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g., 'Marketing Campaign'"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !longUrl.trim()}
              className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto shrink-0"
            >
              {isLoading ? (
                <CircleNotch weight="bold" className="h-4 w-4 animate-spin" />
              ) : (
                <Plus weight="bold" className="h-4 w-4" />
              )}
              <span>Shorten</span>
            </button>
          </div>

          {error && <p className="text-xs font-medium text-rose-600 mt-2">{error}</p>}
        </form>
      ) : (
        /* Result view matching sample.png */
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Original URL
            </label>
            <input
              type="text"
              readOnly
              value={createdLink.long_url}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Your Short Link
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={fullShortUrl}
                className="w-full rounded-xl border border-slate-200 bg-indigo-50/30 px-4 py-2.5 text-sm font-semibold text-indigo-600 pr-24 outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-2 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              >
                {isCopied ? (
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

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition-colors ${
                  showQrCode
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ShareNetwork weight="duotone" className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShortenAnother}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowClockwise weight="duotone" className="h-3.5 w-3.5" />
              <span>Shorten Another</span>
            </button>
          </div>

          {/* Scannable QR Code Box matching sample.png */}
          {showQrCode && (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 text-center transition-all">
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl bg-white p-2 shadow-sm border border-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">
                Scan this code to visit the link
              </p>

              {/* Color customizer */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 border-t border-slate-200/60 pt-3">
                {PRESETS.map((preset, i) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(i)
                      setShowCustom(false)
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      selectedPreset === i
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-900 ml-2"
                >
                  <DownloadSimple weight="bold" className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
