'use client'

import { useEffect, useState, Fragment } from 'react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { getLinkStats, LinkStats } from '../lib/api' 

import { VerticalStackedBarChartAnalytics } from './VerticalStackedBarChartAnalytics'
import { DeviceLineChart } from './DeviceLineChart'         
import { CountryPieChart } from './CountryPieChart'         
import { ReferrerPieChart } from './ReferrerPieChart'       

// --- Main Analytics Modal ---
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
        if (!token) { setError('Authentication error.'); setLoading(false); return }
        try {
          setLoading(true); setError('');
          const data = await getLinkStats(linkId, token)
          setStats(data)
        } catch (err) { console.error(err); setError('Failed to load analytics.') }
        finally { setLoading(false) }
      }; fetchStats()
    } else { setStats(null); setLoading(true); setError(''); }
  }, [linkId, open])

  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="relative z-40" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild as={Fragment} >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </TransitionChild>

        {/* Modal Panel */}
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <TransitionChild as={Fragment} /* ... */ >
            <DialogPanel className="w-full max-w-5xl rounded-xl bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gray-50 px-6 py-4">
                 <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-6 w-6 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900"> Link Analytics {stats ? `(${stats.short_code})` : ''} </h3>
                </div>
                <button onClick={onClose} > <XMarkIcon className="h-6 w-6" /> <span className="sr-only">Close</span> </button>
              </div>

              {/* Body */}
              <div className="max-h-[80vh] overflow-y-auto p-6">
                {loading && <p className="text-center text-gray-500 py-10">Loading analytics...</p>}
                {error && <p className="text-center text-gray-500 py-10">{error}</p>}

                {stats && !loading && !error && (
                  <div className="space-y-8">
                    {/* Stat Card */}
                    <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                        <p className="text-sm font-medium text-gray-700">Total Clicks</p>
                        <p className="text-4xl font-bold text-gray-900">{stats.total_clicks}</p>
                    </div>

                    {/* Chart Grid Layout */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                       {/* Group 1: Browser & Device */}
                       <div className="space-y-6 rounded-lg border border-gray-200 p-4 shadow-sm bg-gray-50/50">
                          <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Device & Platform</h3>
                           <VerticalStackedBarChartAnalytics
                             title="Browsers"
                             description="Top 5 browsers used"
                             data={stats.by_browser}
                             dataKey="Browser"
                           />
                           <DeviceLineChart
                             title="Device Types"
                             description="Clicks by device category"
                             data={stats.by_device}
                           />
                       </div>

                       {/* Group 2: Location & Source */}
                       <div className="space-y-6 rounded-lg border border-gray-200 p-4 shadow-sm bg-gray-50/50">
                          <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Traffic Source</h3>
                           <CountryPieChart
                             title="Countries"
                             description="Top 5 countries by clicks"
                             data={stats.by_country}
                           />
                           <ReferrerPieChart
                             title="Referrers"
                             description="Top 5 referring sources"
                             data={stats.by_referrer}
                           />
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