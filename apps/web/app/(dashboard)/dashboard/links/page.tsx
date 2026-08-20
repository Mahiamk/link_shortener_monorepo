'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMyLinks,
  deleteLink,
  Link as LinkType,
} from '@/lib/api'
import {
  LinkSimple,
  Copy,
  Trash,
  ArrowSquareOut,
  CheckCircle,
  QrCode,
  ChartBar,
  MagnifyingGlass,
  CircleNotch,
} from '@phosphor-icons/react'
import { QrCodeModal } from '@/components/QrCodeModal'
import { AnalyticsModal } from '@/components/AnalyticsModal'
import { D3Sparkline } from '@/components/charts/D3Sparkline'

export default function YourLinksPage() {
  const router = useRouter()
  const [links, setLinks] = useState<LinkType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  // Modals
  const [selectedLinkStats, setSelectedLinkStats] = useState<number | null>(null)
  const [selectedLinkQr, setSelectedLinkQr] = useState<LinkType | null>(null)

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'

  const fetchLinks = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    try {
      setError('')
      setLoading(true)
      const data: LinkType[] = await getMyLinks(token)
      setLinks(
        data
          ? data.sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          : []
      )
    } catch (err: unknown) {
      setError('Failed to load your links.')
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

  const handleCopy = (link: LinkType) => {
    const fullShortUrl = `${BASE_URL}/${link.short_code}`
    navigator.clipboard.writeText(fullShortUrl).then(() => {
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

  const filteredLinks = useMemo(() => {
    return links.filter(
      (l) =>
        l.short_code.toLowerCase().includes(search.toLowerCase()) ||
        (l.original_url || l.long_url || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.tag && l.tag.toLowerCase().includes(search.toLowerCase()))
    )
  }, [links, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Your Links
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage, share, and track all your shortened links.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by URL or tag..."
            className="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 w-64"
          />
        </div>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {/* Table */}
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
              {search ? 'Try adjusting your search criteria.' : 'Create a short link from the dashboard!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Short Link</th>
                  <th scope="col" className="px-5 py-3.5">Original URL</th>
                  <th scope="col" className="px-5 py-3.5">Tag</th>
                  <th scope="col" className="px-5 py-3.5 text-center">Clicks</th>
                  <th scope="col" className="px-5 py-3.5 text-center">Activity</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLinks.map((link) => {
                  const isCopied = copiedId === link.id
                  const linkClicks = link.clicks ?? link.click_count ?? 0
                  const targetUrl = link.original_url || link.long_url || '#'
                  const miniSeries = [
                    Math.max(0, Math.floor(linkClicks * 0.3)),
                    Math.max(0, Math.floor(linkClicks * 0.7)),
                    linkClicks,
                  ]

                  return (
                    <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Short code */}
                      <td className="px-5 py-3.5 font-semibold text-indigo-600">
                        /{link.short_code}
                      </td>

                      {/* Destination */}
                      <td className="px-5 py-3.5 max-w-[280px] truncate text-slate-600">
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-slate-900 inline-flex items-center gap-1"
                        >
                          <span className="truncate">{targetUrl}</span>
                          <ArrowSquareOut weight="bold" className="h-3 w-3 shrink-0 text-slate-400" />
                        </a>
                      </td>

                      {/* Tag */}
                      <td className="px-5 py-3.5 text-slate-500">
                        {link.tag ? (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                            {link.tag}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Clicks */}
                      <td className="px-5 py-3.5 text-center font-bold text-slate-900 tabular-nums">
                        {linkClicks}
                      </td>

                      {/* D3 Sparkline Activity */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-block">
                          <D3Sparkline
                            data={miniSeries}
                            width={75}
                            height={22}
                            color="#4f46e5"
                            strokeWidth={1.5}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopy(link)}
                            title="Copy link"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          >
                            {isCopied ? (
                              <CheckCircle weight="duotone" className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy weight="duotone" className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            onClick={() => setSelectedLinkQr(link)}
                            title="QR Code"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          >
                            <QrCode weight="duotone" className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setSelectedLinkStats(link.id)}
                            title="Analytics"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          >
                            <ChartBar weight="duotone" className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(link.id)}
                            title="Delete"
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

      {/* Modals */}
      <AnalyticsModal
        linkId={selectedLinkStats}
        open={selectedLinkStats !== null}
        onClose={() => setSelectedLinkStats(null)}
      />

      <QrCodeModal
        link={selectedLinkQr}
        open={selectedLinkQr !== null}
        onClose={() => setSelectedLinkQr(null)}
      />
    </div>
  )
}