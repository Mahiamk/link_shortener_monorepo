'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Trash,
  User as UserIcon,
  EnvelopeSimple,
  CalendarBlank,
  CircleNotch,
} from '@phosphor-icons/react'
import {
  getContactSubmissions,
  deleteContactSubmission,
  ContactSubmission,
} from '@/lib/api'

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

  const fetchSubmissions = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getContactSubmissions(token)
      const sorted = (data || []).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setSubmissions(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('No authentication token found. Please log in as admin.')
      setLoading(false)
      return
    }
    fetchSubmissions(token)
  }, [fetchSubmissions])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return

    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await deleteContactSubmission(token, id)
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete submission.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Contact Submissions
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Messages received from visitors via the public contact form.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <CircleNotch weight="bold" className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs">Loading submissions...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs font-semibold text-rose-700">
          {error}
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center text-slate-500 shadow-xs">
          <EnvelopeSimple weight="duotone" className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No submissions yet</p>
          <p className="text-xs text-slate-400 mt-1">
            New contact inquiries will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <UserIcon weight="duotone" className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {sub.first_name} {sub.last_name}
                      </h3>
                      <a
                        href={`mailto:${sub.email}`}
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <EnvelopeSimple weight="duotone" className="h-3 w-3 inline" />
                        {sub.email}
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(sub.id)}
                    title="Delete message"
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  >
                    <Trash weight="duotone" className="h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {sub.message}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <CalendarBlank weight="duotone" className="h-3.5 w-3.5" />
                  {formatDate(sub.created_at)}
                </span>
                <span>ID #{sub.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
