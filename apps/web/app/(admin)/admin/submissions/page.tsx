// In: app/admin/submissions/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Trash2, User, Mail, Calendar } from 'lucide-react'

// This type must match your backend's ContactSubmission schema
interface ContactSubmission {
  id: number
  first_name: string
  last_name: string
  email: string
  message: string
  created_at: string
}

// Helper to format the date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all submissions from the backend
  const fetchSubmissions = async (token: string) => {
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        // This is the new backend endpoint we will create
        `${apiUrl}/api/contact-submissions/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (res.status === 401 || res.status === 403) {
        throw new Error('Unauthorized. Please log in as an admin.')
      }
      if (!res.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data: ContactSubmission[] = await res.json()
      // Sort by most recent first
      data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      setSubmissions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Get token and fetch data on component mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('No authentication token found. Please log in.')
      setLoading(false)
      return
    }
    fetchSubmissions(token)
  }, [])

  // Handle the deletion of a submission
  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this submission permanently?',
      )
    ) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      setError('Token not found. Cannot delete.')
      return
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(
        // This is the new delete endpoint we will create
        `${apiUrl}/api/contact-submissions/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (res.status === 401 || res.status === 403) {
        throw new Error('You do not have permission to delete this.')
      }
      if (!res.ok) {
        throw new Error('Failed to delete submission')
      }

      // Remove the deleted item from the state
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }

  return (
    // This assumes your admin pages have a layout that provides padding.
    // If not, wrap this in a <div> with `className="p-6 sm:p-10"`
    <>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Contact Submissions
      </h1>
      <p className="mt-2 text-lg text-gray-600">
        View and manage messages from the website contact form.
      </p>

      {/* Loading and Error States */}
      {loading && (
        <div className="mt-10 text-center text-gray-500">Loading...</div>
      )}
      {error && (
        <div className="mt-10 rounded-md border border-red-300 bg-red-50 p-4 text-center text-red-700">
          {error}
        </div>
      )}

      {/* Submissions List */}
      {!loading && !error && (
        <div className="mt-8 flow-root">
          <ul role="list" className="divide-y divide-gray-200">
            {submissions.length === 0 ? (
              <li className="py-10 text-center text-gray-500">
                No submissions found.
              </li>
            ) : (
              submissions.map((sub) => (
                <li key={sub.id} className="py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    {/* Submission Info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                          <User className="h-4 w-4 text-gray-500" />
                          {sub.first_name} {sub.last_name}
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <a
                            href={`mailto:${sub.email}`}
                            className="hover:underline"
                          >
                            {sub.email}
                          </a>
                        </p>
                        <p className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {formatDate(sub.created_at)}
                        </p>
                      </div>
                      <blockquote className="mt-2 border-l-4 border-gray-200 pl-4 text-gray-700">
                        {sub.message}
                      </blockquote>
                    </div>

                    {/* Delete Button */}
                    <div className="flex-shrink-0 sm:ml-6 sm:pt-1">
                      <button
                        type="button"
                        onClick={() => handleDelete(sub.id)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </>
  )
}
