'use client'

import { useState, useEffect } from 'react'
import {
  Trash,
  User as UserIcon,
  EnvelopeSimple,
  CalendarBlank,
  CircleNotch,
} from '@phosphor-icons/react'

interface ContactSubmission {
  id: number
  first_name: string
  last_name: string
  email: string
  message: string
  created_at: string
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return dateString
  }
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubmissions = async (token: string) => {
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/contact-submissions/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status === 401 || res.status === 403) {
        throw new Error('Unauthorized. Please log in as an admin.')
      }
      if (!res.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data: ContactSubmission[] = await res.json()
      data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setSubmissions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('No authentication token found.')
      setLoading(false)
      return
    }
    fetchSubmissions(token)
  }, [])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/contact-submissions/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error('Failed to delete')
      setSubmissions((prev) => prev.filter((sub) => sub.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Contact Submissions
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          View messages and feedback received from the contact form.
        </p>
      </div>

      {loading && (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-slate-400">
          <CircleNotch weight="bold" className="h-7 w-7 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs">Loading contact submissions...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-slate-400">
              <EnvelopeSimple weight="duotone" className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">No contact submissions found.</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-slate-900">
                        <UserIcon weight="duotone" className="h-4 w-4 text-indigo-600" />
                        {sub.first_name} {sub.last_name}
                      </span>
                      <a
                        href={`mailto:${sub.email}`}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600"
                      >
                        <EnvelopeSimple weight="duotone" className="h-4 w-4 text-slate-400" />
                        {sub.email}
                      </a>
                      <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <CalendarBlank weight="duotone" className="h-4 w-4" />
                        {formatDate(sub.created_at)}
                      </span>
                    </div>

                    <p className="mt-2 rounded-xl bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700">
                      {sub.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(sub.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors self-start shrink-0"
                  >
                    <Trash weight="duotone" className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
