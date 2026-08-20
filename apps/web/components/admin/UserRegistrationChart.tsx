'use client'

import { useEffect, useState } from 'react'
import { getUserRegistrationStats, RegistrationStat } from '@/lib/api'
import { D3AreaChart } from '@/components/charts/D3AreaChart'
import { CaretDown } from '@phosphor-icons/react'

export function UserRegistrationChart() {
  const [timeRange, setTimeRange] = useState<'day' | 'month' | 'year'>('day')
  const [chartData, setChartData] = useState<RegistrationStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Not authenticated.')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const data = await getUserRegistrationStats(token, timeRange)
        setChartData(data || [])
      } catch (err) {
        console.error('Failed to fetch registration stats:', err)
        setError('Could not load registration data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [timeRange])

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      {/* Header (matching admin.png) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">User Registrations</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing new user signups over time
          </p>
        </div>

        {/* Dropdown Selector */}
        <div className="relative inline-block text-left">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'day' | 'month' | 'year')}
            className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer"
          >
            <option value="day">Daily</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
          <CaretDown
            weight="bold"
            className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      {/* Chart Canvas */}
      <div>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center text-xs text-slate-400">
            Loading chart data...
          </div>
        ) : error ? (
          <div className="flex h-[300px] items-center justify-center text-xs text-rose-500">
            {error}
          </div>
        ) : (
          <D3AreaChart
            data={chartData}
            timeRange={timeRange}
            height={300}
            color="#4f46e5"
            yAxisLabel="Users"
            emptyMessage="No registration data found for this period."
          />
        )}
      </div>
    </div>
  )
}