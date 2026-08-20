'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMyLinks,
  deleteLink,
  Link as LinkType,
} from '@/lib/api'
import {
  LinkSimple,
  ChartBar,
  Copy,
  Trash,
  ArrowSquareOut,
  CheckCircle,
  Star,
  MagnifyingGlass,
  Funnel,
  QrCode,
  ChartLineUp,
  CircleNotch,
} from '@phosphor-icons/react'
import { UrlShortener } from '@/components/UrlShortener'
import { AnalyticsModal } from '@/components/AnalyticsModal'
import { QrCodeModal } from '@/components/QrCodeModal'
import { D3Sparkline } from '@/components/charts/D3Sparkline'

const FAVORITES_KEY = 'favoriteLinks'

function loadFavorites(): Set<number> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveFavorites(ids: Set<number>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...ids]))
}

type Tab = 'all' | 'favorites' | 'active'

export default function DashboardPage() {
  const router = useRouter()
  const [links, setLinks] = useState<LinkType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('all')

  // Modals
  const [analyticsLinkId, setAnalyticsLinkId] = useState<number | null>(null)
  const [qrLink, setQrLink] = useState<LinkType | null>(null)

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    setFavorites(loadFavorites())
  }, [])

  const fetchLinks = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    try {
      setError('')
      setLoading(true)
      const data = await getMyLinks(token)
      setLinks(
        data
          ? data.sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          : []
      )
    } catch (err: unknown) {
      setError('Failed to load links.')
      if (String(err).includes('401')) {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  const totalClicks = useMemo(
    () => links.reduce((sum, l) => sum + (l.click_count || 0), 0),
    [links]
  )

  const handleLinkCreated = (newLink: LinkType) => {
    setLinks((prev) => [newLink, ...prev])
  }

  const handleCopy = (link: LinkType) => {
    const fullUrl = `${BASE_URL}/${link.short_code}`
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(link.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!token) return
    if (!window.confirm('Are you sure you want to delete this link?')) return
    try {
      await deleteLink(id, token)
      setLinks((prev) => prev.filter((l) => l.id !== id))
    } catch {
      alert('Failed to delete link.')
    }
  }

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveFavorites(next)
      return next
    })
  }

  // Filtered links
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesSearch =
        link.short_code.toLowerCase().includes(search.toLowerCase()) ||
        (link.original_url || link.long_url || '').toLowerCase().includes(search.toLowerCase()) ||
        (link.tag && link.tag.toLowerCase().includes(search.toLowerCase()))

      if (!matchesSearch) return false
      if (activeTab === 'favorites') return favorites.has(link.id)
      return true
    })
  }, [links, search, activeTab, favorites])

  // Sparkline data for stat cards
  const linksSparkline = useMemo(() => {
    if (links.length === 0) return [0, 0]
    return [
      Math.max(0, links.length - 4),
      Math.max(1, links.length - 3),
      Math.max(2, links.length - 1),
      links.length,
    ]
  }, [links])

  const clicksSparkline = useMemo(() => {
    if (links.length === 0) return [0, 0]
    const counts = links.slice(0, 8).map((l) => l.click_count || 0)
    return counts.length > 1 ? counts.reverse() : [0, totalClicks]
  }, [links, totalClicks])

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
      </div>

      {/* ── Stat Cards (matching user.png) ────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        {/* Total Links Card */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Links</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 tabular-nums">
              {links.length}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
              <ChartLineUp weight="bold" className="h-3.5 w-3.5" />
              <span>Active URLs</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <LinkSimple weight="duotone" className="h-6 w-6" />
            </div>
            <D3Sparkline data={linksSparkline} width={90} height={28} color="#4f46e5" />
          </div>
        </div>

        {/* Total Clicks Card */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Clicks</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 tabular-nums">
              {totalClicks}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <ChartLineUp weight="bold" className="h-3.5 w-3.5" />
              <span>Total audience traffic</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
              <ChartBar weight="duotone" className="h-6 w-6" />
            </div>
            <D3Sparkline data={clicksSparkline} width={90} height={28} color="#10b981" />
          </div>
        </div>
      </div>

      {/* ── URL Shortener Card (matching user.png) ───────────────────── */}
      <div>
        <UrlShortener onLinkCreated={handleLinkCreated} />
      </div>

      {/* ── Your Links Section ──────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">Your Links</h2>

          {/* Search & Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlass
                weight="bold"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search links or tags..."
                className="rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600">
              <button
                onClick={() => setActiveTab('all')}
                className={`rounded-lg px-3 py-1 transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                All ({links.length})
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex items-center gap-1 rounded-lg px-3 py-1 transition-colors ${
                  activeTab === 'favorites'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                <Star weight="fill" className="h-3 w-3 text-amber-500" />
                Favorites ({favorites.size})
              </button>
            </div>
          </div>
        </div>

        {/* Links Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          {loading && links.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <CircleNotch weight="bold" className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs">Loading links...</p>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <LinkSimple weight="duotone" className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No links found</p>
              <p className="text-xs text-slate-400 mt-1">
                {search ? 'Try adjusting your search query.' : 'Shorten your first URL above!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th scope="col" className="w-10 px-4 py-3 text-center">★</th>
                    <th scope="col" className="px-4 py-3">Short Link</th>
                    <th scope="col" className="px-4 py-3">Original Destination</th>
                    <th scope="col" className="px-4 py-3 text-center">Clicks</th>
                    <th scope="col" className="px-4 py-3 text-center">Activity</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLinks.map((link) => {
                    const isFav = favorites.has(link.id)
                    const isCopied = copiedId === link.id
                    const linkClicks = link.clicks ?? link.click_count ?? 0
                    const targetUrl = link.original_url || link.long_url || '#'
                    const miniSeries = [Math.max(0, Math.floor(linkClicks * 0.2)), Math.max(0, Math.floor(linkClicks * 0.6)), linkClicks]

                    return (
                      <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Favorite */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleFavorite(link.id)}
                            className="text-slate-300 hover:text-amber-500 transition-colors"
                          >
                            <Star
                              weight={isFav ? 'fill' : 'regular'}
                              className={`h-4 w-4 ${isFav ? 'text-amber-400' : ''}`}
                            />
                          </button>
                        </td>

                        {/* Short Link */}
                        <td className="px-4 py-3 font-semibold text-indigo-600">
                          <div className="flex items-center gap-1.5">
                            <span>/{link.short_code}</span>
                            {link.tag && (
                              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                                {link.tag}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Long URL */}
                        <td className="px-4 py-3 max-w-[240px] truncate text-slate-500">
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                          >
                            <span className="truncate">{targetUrl}</span>
                            <ArrowSquareOut weight="bold" className="h-3 w-3 shrink-0 text-slate-400" />
                          </a>
                        </td>

                        {/* Clicks */}
                        <td className="px-4 py-3 text-center font-bold text-slate-900 tabular-nums">
                          {linkClicks}
                        </td>

                        {/* Sparkline Activity */}
                        <td className="px-4 py-3 text-center">
                          <div className="inline-block">
                            <D3Sparkline
                              data={miniSeries}
                              width={70}
                              height={22}
                              color="#4f46e5"
                              strokeWidth={1.5}
                            />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy */}
                            <button
                              onClick={() => handleCopy(link)}
                              title="Copy short link"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            >
                              {isCopied ? (
                                <CheckCircle weight="duotone" className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Copy weight="duotone" className="h-4 w-4" />
                              )}
                            </button>

                            {/* QR */}
                            <button
                              onClick={() => setQrLink(link)}
                              title="QR Code"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                            >
                              <QrCode weight="duotone" className="h-4 w-4" />
                            </button>

                            {/* Analytics */}
                            <button
                              onClick={() => setAnalyticsLinkId(link.id)}
                              title="View Analytics"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                            >
                              <ChartBar weight="duotone" className="h-4 w-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(link.id)}
                              title="Delete Link"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            >
                              <Trash weight="duotone" className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnalyticsModal
        linkId={analyticsLinkId}
        open={analyticsLinkId !== null}
        onClose={() => setAnalyticsLinkId(null)}
      />

      <QrCodeModal
        link={qrLink}
        open={qrLink !== null}
        onClose={() => setQrLink(null)}
      />
    </div>
  )
}
