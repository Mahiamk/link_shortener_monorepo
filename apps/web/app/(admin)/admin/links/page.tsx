'use client'

import { useEffect, useState } from 'react'
import { adminDeleteLink, getAllAdminLinks, Link as LinkType } from '@/lib/api' 
import { ExternalLink, Copy, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { AnalyticsModal } from '@/components/AnalyticsModal'
import ChartBarSquareIcon from '@heroicons/react/24/solid/esm/ChartBarSquareIcon'
import { useRouter } from 'next/dist/client/components/navigation'

export default function AdminLinksPage() {
  const [links, setLinks] = useState<LinkType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<number | null>(null)
  const [updatingLinkId, setUpdatingLinkId] = useState<number | null>(null)

  const router = useRouter();
  //  --- STATE for the modal ---
  const [selectedLinkStats, setSelectedLinkStats] = useState<number | null>(null)
  const [successLinkId, setSuccessLinkId] = useState<number | null>(null);

  //  Base URL from the environment variable
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchLinks = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError("No token found. Please log in.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getAllAdminLinks(token)
        setLinks(data ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [])
      } catch (err) {
        console.error(err)
        setError("Failed to fetch links. You may not have permission.")
        if (String(err).includes('403')) {
          router.push('/login');
        }
      } finally {
        setLoading(false)
      }
    }

    fetchLinks()
  }, [router])

  const handleCopy = (shortCode: string) => {
    const fullShortUrl = `${BASE_URL}/${shortCode}`
    navigator.clipboard.writeText(fullShortUrl)
    setCopiedLink(links.find(l => l.short_code === shortCode)?.id || null)
    setTimeout(() => setCopiedLink(null), 2000) // Reset after 2 seconds
  }

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    if (!confirm('Are you sure you want to delete this link? This action is permanent.')) return
    const startTime = Date.now();
    setUpdatingLinkId(id);
    setSuccessLinkId(null);
    try {
      await adminDeleteLink(token, id)

      const ellapsedTime = Date.now() - startTime;
      const remainingTime = 2000 - ellapsedTime;
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setUpdatingLinkId(null);
      setSuccessLinkId(id);

      setTimeout(() => {
        setLinks((prev) => prev.filter((l) => l.id !== id))
        setSuccessLinkId(null);
      }, 1500);
    } catch (err: unknown) {
      console.error("Delete failed:",err);
      alert('Failed to delete link. You may not have permission.')
    }finally {
      setUpdatingLinkId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">Loading all links...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">
        All Links
      </h2>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Short Link</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Original URL</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Owner Email</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clicks</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {links.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No links found on the platform.
                </td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50/50">
                  {/* Short Link */}
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <a 
                        href={`${BASE_URL}/${link.short_code}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-gray-600 hover:text-gray-800"
                      >
                        {`${BASE_URL.replace(/^https?:\/\//, '')}/${link.short_code}`}
                      </a>
                      <button
                        onClick={() => handleCopy(link.short_code)}
                        title="Copy short link"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <span className="sr-only">Copy</span>
                        {copiedLink === link.id ? (
                          <span className="text-xs text-gray-600">Copied!</span>
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  {/* Original URL */}
                  <td className="max-w-xs whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2 truncate">
                       <img 
                          src={`https://www.google.com/s2/favicons?domain=${new URL(link.original_url).hostname}&sz=16`}
                          alt="favicon"
                          className="h-4 w-4 flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                       />
                      <span className="truncate">{link.original_url}</span>
                      <a 
                        href={link.original_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="Visit original URL"
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                   {/* Owner Email */}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {link.owner ? link.owner.email : `User ID: ${link.owner_id}`}
                  </td>
                  {/* Clicks */}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{link.clicks || 0}</td>
                  {/* Date */}
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(link.created_at).toLocaleDateString()}
                  </td>
                  {/* Actions */}
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    {/* Show spinner if this link is being deleted */}
                    {updatingLinkId === link.id ? (
                      <div className="flex justify-start items-center h-5">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400 inline-flex items-center" />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedLinkStats(link.id)}
                          className="text-gray-400 hover:text-gray-600 inline-flex items-center" title="View stats"
                        >
                          <ChartBarSquareIcon className="h-5 w-5" />
                          <span className="sr-only">View Stats</span>
                        </button>
                        
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="text-gray-500 hover:text-gray-700 inline-flex items-center" title="Delete link"
                        >
                          <Trash2 className="h-5 w-5" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- THE MODAL --- */}
      {/* I used selectedLinkStats directly as the linkId prop */}
      <AnalyticsModal
        linkId={selectedLinkStats}
        open={selectedLinkStats !== null}
        onClose={() => setSelectedLinkStats(null)}
      />

    </div>
  )
}

