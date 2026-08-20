'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminDeleteLink, getAllAdminLinks, Link as LinkType } from '@/lib/api'
import {
  LinkSimple,
  Copy,
  Trash,
  ArrowSquareOut,
  CheckCircle,
  ChartBar,
  CircleNotch,
} from '@phosphor-icons/react'
import { AnalyticsModal } from '@/components/AnalyticsModal'

export default function AdminLinksPage() {
  const [links, setLinks] = useState<LinkType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<number | null>(null)
  const [updatingLinkId, setUpdatingLinkId] = useState<number | null>(null)
  const [selectedLinkStats, setSelectedLinkStats] = useState<number | null>(null)

  const router = useRouter()
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    const fetchLinks = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No token found. Please log in.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getAllAdminLinks(token)
        setLinks(
          data
            ? data.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            : []
        )
      } catch (err) {
        console.error(err)
        setError('Failed to fetch links.')
        if (String(err).includes('403')) {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLinks()
  }, [router])

  const handleCopy = (link: LinkType) => {
    const fullShortUrl = `${BASE_URL}/${link.short_code}`
    navigator.clipboard.writeText(fullShortUrl)
    setCopiedLink(link.id)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!token) return
    if (!confirm('Are you sure you want to delete this link permanently?')) return

    setUpdatingLinkId(id)
    try {
      await adminDeleteLink(token, id)
      setLinks((prev) => prev.filter((l) => l.id !== id))
    } catch {
      alert('Failed to delete link.')
    } finally {
      setUpdatingLinkId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-slate-400">
        <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs">Loading all platform links...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          All Platform Links
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inspect, analyze, or delete shortened links across all users.
        </p>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="px-5 py-3.5">Short Link</th>
                <th scope="col" className="px-5 py-3.5">Original URL</th>
                <th scope="col" className="px-5 py-3.5">Owner</th>
                <th scope="col" className="px-5 py-3.5 text-center">Clicks</th>
                <th scope="col" className="px-5 py-3.5">Created</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {links.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No links found on platform.
                  </td>
                </tr>
              ) : (
                links.map((link) => {
                  const isCopied = copiedLink === link.id
                  return (
                    <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-indigo-600">
                        <div className="flex items-center gap-2">
                          <span>/{link.short_code}</span>
                          <button
                            onClick={() => handleCopy(link)}
                            title="Copy"
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            {isCopied ? (
                              <CheckCircle weight="duotone" className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy weight="duotone" className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 max-w-xs truncate text-slate-600">
                        <a
                          href={link.original_url || link.long_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-slate-900 inline-flex items-center gap-1"
                        >
                          <span className="truncate">{link.original_url || link.long_url}</span>
                          <ArrowSquareOut weight="bold" className="h-3 w-3 shrink-0 text-slate-400" />
                        </a>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500">
                        {link.owner_id ? `User #${link.owner_id}` : 'Public / Anonymous'}
                      </td>

                      <td className="px-5 py-3.5 text-center font-bold text-slate-900 tabular-nums">
                        {link.clicks ?? link.click_count ?? 0}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(link.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {updatingLinkId === link.id ? (
                          <CircleNotch weight="bold" className="h-4 w-4 animate-spin text-indigo-600 inline" />
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedLinkStats(link.id)}
                              title="View analytics"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                            >
                              <ChartBar weight="duotone" className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(link.id)}
                              title="Delete link"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash weight="duotone" className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnalyticsModal
        linkId={selectedLinkStats}
        open={selectedLinkStats !== null}
        onClose={() => setSelectedLinkStats(null)}
      />
    </div>
  )
}
