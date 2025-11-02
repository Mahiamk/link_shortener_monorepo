'use client'

import { useEffect, useState, useCallback } from 'react' // Added useCallback
import { useRouter } from 'next/navigation'
// ✅ --- ADDED User AND getUserProfile ---
import { 
  getMyLinks, 
  deleteLink, 
  Link as LinkType, 
  User, 
  getUserProfile 
} from '@/lib/api' // Adjust path if needed
import { 
  BarChart2, 
  Link as LinkIcon, 
  LogOut, 
  Copy, 
  Trash2, 
  User as UserIcon,
  ExternalLink,
  ShieldCheck,
  ChartBarIcon
} from 'lucide-react'

// Import the UrlShortener component
import { UrlShortener } from '@/components/UrlShortener'
import { AnalyticsModal } from '@/components/AnalyticsModal'

// --- Reusable Stat Card Component ---
function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  // ... (Your StatCard component is fine)
  return (
    <div className="flex-1 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

// --- Reusable User Dropdown ---
// ✅ --- We will add an "Admin" link to this ---
function UserMenu({ 
}: { 
  email: string, 
  isSuperuser: boolean, // <-- Add this prop
  onLogout: () => void 
}) {  
  return (
    <div className="relative">
      {/* <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <UserIcon className="h-5 w-5" />
      </button> */}
      
      {/* {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-60 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="py-1">
            <div className="px-4 py-2">
              <p className="text-sm text-gray-500">Signed  me in as</p>
              <p className="truncate text-sm font-medium text-gray-900">{email}</p>
            </div>
            <div className="border-t border-gray-100"></div>
            
            {isSuperuser && (
              <a
                href="/admin" // Link to your admin page
                className="group flex w-full items-center gap-2 px-4 py-3 text-sm text-indigo-600 hover:bg-gray-100"
              >
                <ShieldCheck className="h-5 w-5 text-indigo-500 group-hover:text-indigo-600" />
                Admin Dashboard
              </a>
            )}
            
            <button
              onClick={onLogout}
              className="group flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 text-gray-500 group-hover:text-indigo-600" />
              Logout
            </button>
          </div>
        </div>
      )} */}
    </div>
  )
}

// --- Main Dashboard Page ---
export default function DashboardPage() {
  const router = useRouter()
  const [links, setLinks] = useState<LinkType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null) // <-- Store the full user object
  const [copiedLink, setCopiedLink] = useState<number | null>(null)

  // --- NEW STATE for the modal ---
  const [selectedLinkStats, setSelectedLinkStats] = useState<number | null>(null)
  // Get base URL from the environment variable
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000';

  // --- Event Handlers ---
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    router.push('/login')
  }, [router])

  // --- Data Fetching ---
  // We've combined all loading logic into one useEffect
  useEffect(() => {
    const loadDashboard = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        handleLogout()
        return
      }

      try {
        // 1. --- FETCH USER PROFILE FIRST ---
        const userProfile = await getUserProfile(token)
        
        // 2. --- CHECK FOR ADMIN ---
        if (userProfile.is_superuser) {
          // If they are an admin, send them to the admin page
          router.push('/admin') 
          return; // Stop loading this dashboard
        }
        
        // 3. --- If NOT admin, proceed to load regular dashboard ---
        setUser(userProfile) // Save the user object

        // 4. --- Fetch the user's links ---
        const data: LinkType[] = await getMyLinks(token)
        setLinks(data ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [])

      } catch (err: unknown) {
        if (String(err).includes('401')) {
          handleLogout()
        }
        setError('Failed to load your dashboard.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router, handleLogout]) // Add handleLogout to dependency array

  
  // --- This is the new "refetch on focus" logic ---
  const fetchLinks = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      handleLogout();
      return;
    }
    // This is a "silent" fetch, so we don't set loading
    try {
      const data: LinkType[] = await getMyLinks(token);
      setLinks(data ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : []);
    } catch (err) {
      console.warn("Failed to auto-refresh links", err);
      if (String(err).includes('401')) {
        handleLogout(); // Log out if token expired
      }
    }
  }, [handleLogout]);

  useEffect(() => {
    window.addEventListener('focus', fetchLinks);
    return () => {
      window.removeEventListener('focus', fetchLinks);
    };
  }, [fetchLinks]);
  

  const handleCopy = (shortCode: string) => {
    const fullShortUrl = `${BASE_URL}/${shortCode}`
    navigator.clipboard.writeText(fullShortUrl)
    setCopiedLink(links.find(l => l.short_code === shortCode)?.id || null)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token')
    if (!token) {
      handleLogout()
      return
    }
    if (!confirm('Are you sure you want to delete this link?')) return

    try {
      await deleteLink(id, token)
      setLinks((prev) => prev.filter((l) => l.id !== id))
    } catch (err: unknown) {
      if (String(err).includes('401')) {
        handleLogout()
      }
      alert('Failed to delete link.')
    }
  }

  const handleLinkCreated = (newLink: LinkType) => {
    setLinks((prev) => [newLink, ...prev])
  }

  // --- Calculated Stats ---
  const totalClicks = links.reduce((acc, link) => acc + (link.clicks || 0), 0);

  // --- RENDER LOGIC ---
  if (loading || !user) { // <-- Wait for user object
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    )
  }

  // This check will only be true for a split second if the redirect is slow
  if (user.is_superuser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Redirecting to admin dashboard...</p>
      </div>
    )
  }
  if (user.is_superuser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Redirecting to admin dashboard...</p>
      </div>
    )
  }

  // --- Main Dashboard Render ---
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* --- Header --- */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white/75 px-6 backdrop-blur-sm">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <UserMenu 
          email={user.email} // <-- Use email from user object
          isSuperuser={user.is_superuser} // <-- Pass the flag
          onLogout={handleLogout} 
        />
      </header>

      {/* --- Main Content --- */}
      <main className="mx-auto max-w-6xl p-6 py-10">
        {/* --- Stat Cards --- */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <StatCard 
            title="Total Links" 
            value={links.length} 
            icon={<LinkIcon className="h-5 w-5" />} 
          />
          <StatCard 
            title="Total Clicks" 
            value={totalClicks} 
            icon={<BarChart2 className="h-5 w-5" />} 
          />
        </div>

        {/* --- URL Shortener Component --- */}
        <div className="mb-10">
          <UrlShortener onLinkCreated={handleLinkCreated} />
        </div>

        {/* --- Links Table --- */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Links</h2>
          {error && <p className="mb-4 text-red-500">{error}</p>}
          
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Table Head */}
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Short Link</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Original URL</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clicks</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody className="divide-y divide-gray-200">
                {links.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      You haven’t created any links yet.
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
                            className="font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            {`${BASE_URL.replace(/^https?:\/\//, '')}/${link.short_code}`}
                          </a>
                          <button
                            onClick={() => handleCopy(link.short_code)}
                            title="Copy short link"
                            className="text-gray-400 hover:text-indigo-600"
                          >
                            <span className="sr-only">Copy</span>
                            {copiedLink === link.id ? (
                              <span className="text-xs text-indigo-600">Copied!</span>
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
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                           />
                          <span className="truncate">{link.original_url}</span>
                          <a 
                            href={link.original_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title="Visit original URL"
                            className="ml-2 text-gray-400 hover:text-indigo-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                      {/* Clicks */}
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{link.clicks || 0}</td>
                      {/* Date */}
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(link.created_at).toLocaleDateString()}
                      </td>
                      {/* Actions */}
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedLinkStats(link.id)}
                          className="text-gray-400 hover:text-indigo-600"
                          title="View stats"
                        >
                          <ChartBarIcon className="h-5 w-5" />
                          <span className="sr-only">View Stats</span>
                        </button>

                        <button 
                          onClick={() => handleDelete(link.id)} 
                          className="text-red-500 hover:text-red-700"
                          title="Delete link"
                        >
                          <Trash2 className="h-5 w-5" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {/* --- THE MODAL AT THE END --- */}
      {/* We use selectedLinkStats directly as the linkId prop */}
      <AnalyticsModal
        linkId={selectedLinkStats}
        open={selectedLinkStats !== null}
        onClose={() => setSelectedLinkStats(null)}
      />
    </div>
  )
}

