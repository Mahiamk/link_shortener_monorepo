'use client'

import { useEffect, useState, Fragment } from 'react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import {
  ChartBar,
  X,
  DeviceMobile,
  Browsers,
  GlobeHemisphereWest,
  LinkSimple,
  CircleNotch,
} from '@phosphor-icons/react'
import { getLinkStats, LinkStats } from '../lib/api'
import { D3DonutChart } from './charts/D3DonutChart'
import { D3BarChart } from './charts/D3BarChart'

export function AnalyticsModal({
  linkId,
  open,
  onClose,
}: {
  linkId: number | null
  open: boolean
  onClose: () => void
}) {
  const [stats, setStats] = useState<LinkStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && linkId !== null) {
      const fetchStats = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Authentication error.')
          setLoading(false)
          return
        }
        try {
          setLoading(true)
          setError('')
          const data = await getLinkStats(linkId, token)
          setStats(data)
        } catch (err) {
          console.error(err)
          setError('Failed to load analytics.')
        } finally {
          setLoading(false)
        }
      }
      fetchStats()
    } else {
      setStats(null)
      setLoading(true)
      setError('')
    }
  }, [linkId, open])

  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <ChartBar weight="duotone" className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Link Analytics {stats ? `(/${stats.short_code})` : ''}
                    </h3>
                    {(stats?.original_url || stats?.target_url) && (
                      <p className="text-xs text-slate-500 truncate max-w-md">
                        {stats.original_url || stats.target_url}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                >
                  <X weight="bold" className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <CircleNotch weight="bold" className="h-7 w-7 animate-spin text-indigo-600 mb-2" />
                    <p className="text-xs">Loading analytics data...</p>
                  </div>
                )}

                {error && (
                  <p className="text-center text-xs text-rose-600 py-10">{error}</p>
                )}

                {stats && !loading && !error && (
                  <div className="space-y-6">
                    {/* Top Stat Card */}
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Total Clicks
                        </p>
                        <p className="mt-1 text-3xl font-extrabold text-slate-900 tabular-nums">
                          {stats.total_clicks}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                          Active Link
                        </span>
                      </div>
                    </div>

                    {/* Chart Grid */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Referrers */}
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                          <LinkSimple weight="duotone" className="h-4 w-4 text-indigo-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Referring Sources
                          </h4>
                        </div>
                        <D3DonutChart data={stats.by_referrer || {}} height={180} />
                      </div>

                      {/* Countries */}
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                          <GlobeHemisphereWest weight="duotone" className="h-4 w-4 text-indigo-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Top Countries
                          </h4>
                        </div>
                        <D3DonutChart data={stats.by_country || {}} height={180} />
                      </div>

                      {/* Devices */}
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                          <DeviceMobile weight="duotone" className="h-4 w-4 text-indigo-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Device Types
                          </h4>
                        </div>
                        <D3BarChart data={stats.by_device || {}} color="#4f46e5" />
                      </div>

                      {/* Browsers */}
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                          <Browsers weight="duotone" className="h-4 w-4 text-indigo-600" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Browsers
                          </h4>
                        </div>
                        <D3BarChart data={stats.by_browser || {}} color="#818cf8" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}