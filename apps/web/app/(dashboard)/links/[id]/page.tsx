// 'use client'

// import { useEffect, useState, useMemo, useCallback } from 'react'
// import { useRouter } from 'next/navigation' // Corrected import
// import {
//   getMyLinks,
//   deleteLink,
//   Link as LinkType,
// } from '../../../lib/api' // Use relative path
// import {
//   Copy,
//   Trash2,
//   ExternalLink,
//   ChartBarSquareIcon
// } from 'lucide-react'
// import { AnalyticsModal } from '../../../components/AnalyticsModal' // Use relative path

// export default function YourLinksPage() {
//   const router = useRouter()
//   const [links, setLinks] = useState<LinkType[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [copiedLink, setCopiedLink] = useState<number | null>(null)
//   const [selectedLinkStats, setSelectedLinkStats] = useState<number | null>(null)

//   const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';

//   const fetchLinks = useCallback(async () => {
//     const token = localStorage.getItem('token')
//     if (!token) {
//        router.push('/auth/login')
//        return
//     }
//     try {
//       setError('')
//       setLoading(true)
//       const data: LinkType[] = await getMyLinks(token)
//       setLinks(data ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [])
//     } catch (err: unknown) {
//       setError('Failed to load your links.')
//       if (String(err).includes('401')) {
//          localStorage.removeItem('token'); localStorage.removeItem('userEmail');
//          router.push('/auth/login')
//       }
//     } finally {
//       setLoading(false)
//     }
//   }, [router])

//   useEffect(() => {
//     fetchLinks()
//     const handleFocus = () => fetchLinks()
//     window.addEventListener('focus', handleFocus)
//     return () => window.removeEventListener('focus', handleFocus)
//   }, [fetchLinks])

//   const handleCopy = (shortCode: string) => {
//     const fullShortUrl = `${BASE_URL}/${shortCode}`
//     navigator.clipboard.writeText(fullShortUrl)
//     setCopiedLink(links.find(l => l.short_code === shortCode)?.id || null)
//     setTimeout(() => setCopiedLink(null), 2000)
//   }

//   const handleDelete = async (id: number) => {
//     const token = localStorage.getItem('token')
//     if (!token) {
//       router.push('/auth/login')
//       return
//     }
//     if (!window.confirm('Are you sure you want to delete this link?')) return // Use window.confirm
//     try {
//       await deleteLink(id, token)
//       setLinks((prev) => prev.filter((l) => l.id !== id))
//     } catch (err: unknown) {
//       alert('Failed to delete link.')
//        if (String(err).includes('401')) {
//          localStorage.removeItem('token'); localStorage.removeItem('userEmail');
//          router.push('/auth/login')
//       }
//     }
//   }

//   return (
//     <div>
//       <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Links</h2>
//       {error && <p className="mb-4 text-red-500">{error}</p>}

//       <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
//         {loading && links.length === 0 ? (
//            <div className="p-10 text-center text-gray-500">Loading links...</div>
//         ) : (
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Short Link</th>
//                 <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Original URL</th>
//                 <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clicks</th>
//                 <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
//                 <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {!loading && links.length === 0 ? (
//                 <tr>
//                   <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
//                     You haven’t created any links yet. Go to Overview to create one!
//                   </td>
//                 </tr>
//               ) : (
//                 links.map((link) => (
//                   <tr key={link.id} className="hover:bg-gray-50/50">
//                     <td className="whitespace-nowrap px-6 py-4">
//                       <div className="flex items-center gap-3">
//                         <a href={`${BASE_URL}/${link.short_code}`} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-800">
//                           {`${BASE_URL.replace(/^https?:\/\//, '')}/${link.short_code}`}
//                         </a>
//                         <button onClick={() => handleCopy(link.short_code)} title="Copy short link" className="text-gray-400 hover:text-indigo-600">
//                           {copiedLink === link.id ? (<span className="text-xs text-indigo-600">Copied!</span>) : (<Copy className="h-4 w-4" />)}
//                         </button>
//                       </div>
//                     </td>
//                     <td className="max-w-xs whitespace-nowrap px-6 py-4 text-sm text-gray-500">
//                       <div className="flex items-center gap-2 truncate">
//                          <img src={`https://www.google.com/s2/favicons?domain=${new URL(link.original_url).hostname}&sz=16`} alt="favicon" className="h-4 w-4 flex-shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
//                         <span className="truncate">{link.original_url}</span>
//                         <a href={link.original_url} target="_blank" rel="noopener noreferrer" title="Visit original URL" className="ml-2 text-gray-400 hover:text-indigo-600">
//                           <ExternalLink className="h-4 w-4" />
//                         </a>
//                       </div>
//                     </td>
//                     <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{link.clicks || 0}</td>
//                     <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{new Date(link.created_at).toLocaleDateString()}</td>
//                     <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
//                       <button onClick={() => setSelectedLinkStats(link.id)} className="text-gray-400 hover:text-indigo-600" title="View stats">
//                         <ChartBarSquareIcon className="h-5 w-5" />
//                       </button>
//                       <button onClick={() => handleDelete(link.id)} className="ml-4 text-red-500 hover:text-red-700" title="Delete link">
//                         <Trash2 className="h-5 w-5" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//          )}
//       </div>
//       <AnalyticsModal
//         linkId={selectedLinkStats}
//         open={selectedLinkStats !== null}
//         onClose={() => setSelectedLinkStats(null)}
//       />
//     </div>
//   )
// }