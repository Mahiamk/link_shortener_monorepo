'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMyLinks,
  deleteLink,
  Link as LinkType,
  User,
  getUserProfile,
} from '@/lib/api'
import {
  BarChart2,
  Link as LinkIcon,
  Copy,
  Trash2,
  ExternalLink,
  CopyCheck,
  Star,
  Search,
  TrendingUp,
  MousePointerClick,
  Filter,
  ChartBar,
} from 'lucide-react'
import { UrlShortener } from '@/components/UrlShortener'
import { AnalyticsModal } from '@/components/AnalyticsModal'

// ─── Favorites helpers (localStorage) ───────────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'all' | 'favorites' | 'active' | 'expired'

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  icon,
  accent,
  sub,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  accent: string
  sub?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70 transition-shadow hover:shadow-md">
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 ring-1 ring-gray-100">
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
  counts,
}: {
  active: Tab
  onChange: (t: Tab) => void
  counts: Record<Tab, number>
}) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'favorites', label: '★ Favorites' },
    { id: 'active', label: 'Active' },
    { id: 'expired', label: 'Expired' },
  ]
  return (
    <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
            active === t.id
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.label}
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
              active === t.id ? 'bg-violet-100 text-violet-700' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {counts[t.id]}
          </span>
        </button>
      ))}
    </div>
  )
}

// ─── Link Row (desktop) ───────────────────────────────────────────────────────

function LinkRow({
  link,
  isFavorite,
  isCopied,
  baseUrl,
  onCopy,
  onFavorite,
  onStats,
  onDelete,
}: {
  link: LinkType
  isFavorite: boolean
  isCopied: boolean
  baseUrl: string
  onCopy: () => void
  onFavorite: () => void
  onStats: () => void
  onDelete: () => void
}) {
  const isExpired = link.is_expired
  const shortUrl = `${baseUrl.replace(/^https?:\/\//, '')}/${link.short_code}`
  const fullShortUrl = `${baseUrl}/${link.short_code}`
  let hostname = ''
  try { hostname = new URL(link.original_url).hostname } catch { /* noop */ }

  return (
    <tr className="group hover:bg-violet-50/30 transition-colors">
      {/* Favorite */}
      <td className="w-10 px-4 py-4">
        <button
          onClick={onFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`transition-all hover:scale-110 ${isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
        >
          <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </td>

      {/* Short link */}
      <td className="whitespace-nowrap px-4 py-4">
        <div className="flex items-center gap-2">
          <a
            href={fullShortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-violet-600 hover:text-violet-800 text-sm transition-colors"
          >
            {shortUrl}
          </a>
          <button
            onClick={onCopy}
            title="Copy"
            className="text-gray-300 hover:text-violet-500 transition-colors"
          >
            {isCopied
              ? <CopyCheck className="h-3.5 w-3.5 text-emerald-500" />
              : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        {link.tag && (
          <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 ring-1 ring-indigo-100">
            {link.tag}
          </span>
        )}
      </td>

      {/* Original URL */}
      <td className="max-w-[260px] px-4 py-4">
        <div className="flex items-center gap-2 min-w-0">
          {hostname && (
            <img
              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
              alt=""
              className="h-4 w-4 shrink-0 rounded-sm"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          <span className="truncate text-sm text-gray-500">{link.original_url}</span>
          <a
            href={link.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </td>

      {/* Clicks */}
      <td className="whitespace-nowrap px-4 py-4">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <MousePointerClick className="h-3.5 w-3.5 text-gray-400" />
          {link.clicks || 0}
        </div>
      </td>

      {/* Date */}
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-400">
        {new Date(link.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>

      {/* Status */}
      <td className="whitespace-nowrap px-4 py-4">
        {isExpired ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-red-100">
            Expired
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 ring-1 ring-emerald-100">
            Active
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="whitespace-nowrap px-4 py-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onStats}
            title="View analytics"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-violet-100 hover:text-violet-600 transition-colors"
          >
            <ChartBar className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Link Card (mobile) ───────────────────────────────────────────────────────

function LinkCard({
  link,
  isFavorite,
  isCopied,
  baseUrl,
  onCopy,
  onFavorite,
  onStats,
  onDelete,
}: {
  link: LinkType
  isFavorite: boolean
  isCopied: boolean
  baseUrl: string
  onCopy: () => void
  onFavorite: () => void
  onStats: () => void
  onDelete: () => void
}) {
  const shortUrl = `${baseUrl.replace(/^https?:\/\//, '')}/${link.short_code}`
  const fullShortUrl = `${baseUrl}/${link.short_code}`
  const isExpired = link.is_expired
  let hostname = ''
  try { hostname = new URL(link.original_url).hostname } catch { /* noop */ }

  return (
    <li className="flex flex-col gap-3 p-4 transition-colors hover:bg-gray-50/80">
      {/* Row 1: short link + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <a
            href={fullShortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-violet-600 hover:text-violet-800 text-sm"
          >
            {shortUrl}
          </a>
          {link.tag && (
            <span className="ml-2 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 ring-1 ring-indigo-100">
              {link.tag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onFavorite} className={`transition-all ${isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}>
            <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onCopy} className="text-gray-400 hover:text-violet-500 transition-colors">
            {isCopied ? <CopyCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
          <button onClick={onStats} className="text-gray-400 hover:text-violet-600 transition-colors">
            <ChartBar className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Row 2: original url */}
      <div className="flex items-center gap-2 min-w-0">
        {hostname && (
          <img
            src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
            alt=""
            className="h-4 w-4 shrink-0 rounded-sm"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        )}
        <span className="truncate text-xs text-gray-500">{link.original_url}</span>
        <a href={link.original_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-gray-300 hover:text-gray-500">
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Row 3: meta */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
          isExpired ? 'bg-red-50 text-red-600 ring-red-100' : 'bg-emerald-50 text-emerald-600 ring-emerald-100'
        }`}>
          {isExpired ? 'Expired' : 'Active'}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <MousePointerClick className="h-3 w-3" />
          {link.clicks || 0} clicks
        </span>
        <span className="text-xs text-gray-300">
          {new Date(link.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </li>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [links, setLinks] = useState<LinkType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [selectedLinkStats, setSelectedLinkStats] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'

  // Load favorites from localStorage on mount
  useEffect(() => { setFavorites(loadFavorites()) }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    router.push('/login')
  }, [router])

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token')
      if (!token) { handleLogout(); return }
      try {
        const profile = await getUserProfile(token)
        if (profile.is_superuser) { router.push('/admin'); return }
        setUser(profile)
        const data: LinkType[] = await getMyLinks(token)
        setLinks(data ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [])
      } catch (err: unknown) {
        if (String(err).includes('401')) handleLogout()
        setError('Failed to load dashboard.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router, handleLogout])

  const fetchLinks = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) { handleLogout(); return }
    try {
      const data: LinkType[] = await getMyLinks(token)
      setLinks(data ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [])
    } catch (err) {
      if (String(err).includes('401')) handleLogout()
    }
  }, [handleLogout])

  useEffect(() => {
    window.addEventListener('focus', fetchLinks)
    return () => window.removeEventListener('focus', fetchLinks)
  }, [fetchLinks])

  const handleCopy = (shortCode: string, id: number) => {
    navigator.clipboard.writeText(`${BASE_URL}/${shortCode}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!token) { handleLogout(); return }
    if (!confirm('Delete this link? This cannot be undone.')) return
    try {
      await deleteLink(id, token)
      setLinks((prev) => prev.filter((l) => l.id !== id))
      setFavorites((prev) => { const next = new Set(prev); next.delete(id); saveFavorites(next); return next })
    } catch (err: unknown) {
      if (String(err).includes('401')) handleLogout()
    }
  }

  const handleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      saveFavorites(next)
      return next
    })
  }

  const handleLinkCreated = (newLink: LinkType) => setLinks((prev) => [newLink, ...prev])

  // ── Computed stats ──
  const totalClicks = links.reduce((acc, l) => acc + (l.clicks || 0), 0)
  const activeLinks = links.filter((l) => !l.is_expired)
  const mostClickedLink = links.reduce<LinkType | null>((best, l) => (!best || (l.clicks || 0) > (best.clicks || 0) ? l : best), null)

  // ── Filtered links ──
  const filteredLinks = useMemo(() => {
    let base = links
    if (tab === 'favorites') base = base.filter((l) => favorites.has(l.id))
    else if (tab === 'active') base = base.filter((l) => !l.is_expired)
    else if (tab === 'expired') base = base.filter((l) => l.is_expired)

    if (search.trim()) {
      const q = search.toLowerCase()
      base = base.filter(
        (l) => l.short_code.toLowerCase().includes(q) || l.original_url.toLowerCase().includes(q) || (l.tag || '').toLowerCase().includes(q)
      )
    }
    return base
  }, [links, tab, search, favorites])

  const tabCounts: Record<Tab, number> = useMemo(() => ({
    all: links.length,
    favorites: links.filter((l) => favorites.has(l.id)).length,
    active: links.filter((l) => !l.is_expired).length,
    expired: links.filter((l) => l.is_expired).length,
  }), [links, favorites])

  // ── Loading ──
  if (loading || !user) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  if (user.is_superuser) {
    return <div className="flex h-[70vh] items-center justify-center"><p className="text-gray-400">Redirecting…</p></div>
  }

  const emptyMessage =
    tab === 'favorites' ? { title: 'No favorites yet', sub: 'Star a link to pin it here.' }
    : tab === 'active' ? { title: 'No active links', sub: 'All your links have expired.' }
    : tab === 'expired' ? { title: 'No expired links', sub: 'All your links are still active.' }
    : { title: 'No links yet', sub: 'Shorten your first URL above to get started.' }

  return (
    <div className="space-y-6 pb-10">

      {/* ── Greeting ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, <span className="text-violet-600">{user.email.split('@')[0]}</span> 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening with your links today.</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Links"
          value={links.length}
          icon={<LinkIcon className="h-5 w-5" />}
          accent="bg-violet-500"
          sub={`${activeLinks.length} active`}
        />
        <StatCard
          title="Total Clicks"
          value={totalClicks.toLocaleString()}
          icon={<MousePointerClick className="h-5 w-5" />}
          accent="bg-blue-500"
          sub="across all links"
        />
        <StatCard
          title="Favorites"
          value={favorites.size}
          icon={<Star className="h-5 w-5" />}
          accent="bg-amber-400"
          sub="saved links"
        />
        <StatCard
          title="Top Clicks"
          value={mostClickedLink?.clicks || 0}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="bg-emerald-500"
          sub={mostClickedLink ? `/${mostClickedLink.short_code}` : 'no links yet'}
        />
      </div>

      {/* ── URL Shortener ── */}
      <UrlShortener onLinkCreated={handleLinkCreated} />

      {/* ── Links Section ── */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/70">

        {/* Section header */}
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">Your Links</h2>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="overflow-x-auto">
            <TabBar active={tab} onChange={setTab} counts={tabCounts} />
          </div>
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search links…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all"
            />
          </div>
        </div>

        {/* Empty state */}
        {filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-300 mb-4">
              {tab === 'favorites' ? <Star className="h-7 w-7" /> : <Filter className="h-7 w-7" />}
            </div>
            <p className="font-semibold text-gray-700">{emptyMessage.title}</p>
            <p className="mt-1 text-sm text-gray-400">{emptyMessage.sub}</p>
          </div>
        ) : (
          <>
            {/* ── Mobile cards ── */}
            <ul className="divide-y divide-gray-100 md:hidden">
              {filteredLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  isFavorite={favorites.has(link.id)}
                  isCopied={copiedId === link.id}
                  baseUrl={BASE_URL}
                  onCopy={() => handleCopy(link.short_code, link.id)}
                  onFavorite={() => handleFavorite(link.id)}
                  onStats={() => setSelectedLinkStats(link.id)}
                  onDelete={() => handleDelete(link.id)}
                />
              ))}
            </ul>

            {/* ── Desktop table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="w-10 px-4 py-3" />
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Short Link</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Original URL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Clicks</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLinks.map((link) => (
                    <LinkRow
                      key={link.id}
                      link={link}
                      isFavorite={favorites.has(link.id)}
                      isCopied={copiedId === link.id}
                      baseUrl={BASE_URL}
                      onCopy={() => handleCopy(link.short_code, link.id)}
                      onFavorite={() => handleFavorite(link.id)}
                      onStats={() => setSelectedLinkStats(link.id)}
                      onDelete={() => handleDelete(link.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
              <span>Showing {filteredLinks.length} of {links.length} links</span>
              {tab !== 'all' && (
                <button onClick={() => { setTab('all'); setSearch('') }} className="text-violet-500 hover:text-violet-700 font-medium transition-colors">
                  Clear filter
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <AnalyticsModal
        linkId={selectedLinkStats}
        open={selectedLinkStats !== null}
        onClose={() => setSelectedLinkStats(null)}
      />
    </div>
  )
}
