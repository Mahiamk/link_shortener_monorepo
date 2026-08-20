'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  getAggregatedClicks,
  getAggregatedDevices,
  getAggregatedBrowsers,
  getAggregatedReferrers,
  getAggregatedCountries,
  ClickOverTimeStat,
  BreakdownStats,
} from '@/lib/api'
import {
  ChartLineUp,
  ChartBar,
  GlobeHemisphereWest,
  DeviceMobile,
  Browsers,
  LinkSimple,
  CircleNotch,
} from '@phosphor-icons/react'
import { D3AreaChart } from '@/components/charts/D3AreaChart'
import { D3DonutChart } from '@/components/charts/D3DonutChart'
import { D3BarChart } from '@/components/charts/D3BarChart'
import { D3Sparkline } from '@/components/charts/D3Sparkline'

export default function AnalysisPage() {
  const router = useRouter()

  const [clicksData, setClicksData] = useState<ClickOverTimeStat[]>([])
  const [deviceData, setDeviceData] = useState<BreakdownStats>({})
  const [browserData, setBrowserData] = useState<BreakdownStats>({})
  const [referrerData, setReferrerData] = useState<BreakdownStats>({})
  const [countryData, setCountryData] = useState<BreakdownStats>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeInterval, setTimeInterval] = useState<'day' | 'month' | 'year'>('day')

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Not authenticated. Redirecting to login...')
        setTimeout(() => router.push('/login'), 1500)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const [clicksRes, devicesRes, browsersRes, referrersRes, countriesRes] =
          await Promise.all([
            getAggregatedClicks(token, timeInterval),
            getAggregatedDevices(token),
            getAggregatedBrowsers(token),
            getAggregatedReferrers(token),
            getAggregatedCountries(token),
          ])

        setClicksData(clicksRes || [])
        setDeviceData(devicesRes || {})
        setBrowserData(browsersRes || {})
        setReferrerData(referrersRes || {})
        setCountryData(countriesRes || {})
      } catch (err: unknown) {
        console.error('Failed to load analysis data:', err)
        setError('Failed to load analysis data.')
        if (String(err).includes('401')) {
          localStorage.removeItem('token')
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeInterval, router])

  const totalClicksPeriod = useMemo(
    () => clicksData.reduce((acc, curr) => acc + (curr.count || 0), 0),
    [clicksData]
  )

  const sparklineSeries = useMemo(() => {
    if (clicksData.length === 0) return [0, 0]
    return clicksData.map((d) => d.count)
  }, [clicksData])

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center text-slate-400">
        <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading comprehensive analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Analytics & Insights
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time traffic performance, audience demographics, and referrer channels.
          </p>
        </div>

        {/* Time Interval Selector */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          {(['day', 'month', 'year'] as const).map((interval) => (
            <button
              key={interval}
              onClick={() => setTimeInterval(interval)}
              className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                timeInterval === interval
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {interval === 'day' ? 'Daily' : interval === 'month' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {/* ── Top Summary Sparkline Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Period Clicks</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ChartLineUp weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900 tabular-nums">
              {totalClicksPeriod}
            </p>
            <D3Sparkline data={sparklineSeries} width={80} height={24} color="#4f46e5" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Unique Countries</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <GlobeHemisphereWest weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
            {Object.keys(countryData).length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Referrer Channels</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <LinkSimple weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
            {Object.keys(referrerData).length}
          </p>
        </div>
      </div>

      {/* ── Clicks Over Time (D3 Area Chart) ─────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Traffic Trend Over Time</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click activity aggregated by selected interval
            </p>
          </div>
        </div>
        <D3AreaChart
          data={clicksData}
          timeRange={timeInterval}
          height={280}
          color="#4f46e5"
          yAxisLabel="Clicks"
        />
      </div>

      {/* ── Demographics & Channels Grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Referrers (D3 Donut Chart) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <LinkSimple weight="duotone" className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Top Referring Domains</h3>
          </div>
          <D3DonutChart data={referrerData} height={200} emptyMessage="No referrer records found." />
        </div>

        {/* Countries (D3 Donut Chart) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <GlobeHemisphereWest weight="duotone" className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Geographic Distribution</h3>
          </div>
          <D3DonutChart data={countryData} height={200} emptyMessage="No country records found." />
        </div>

        {/* Devices (D3 Bar Chart) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <DeviceMobile weight="duotone" className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Device Breakdown</h3>
          </div>
          <D3BarChart data={deviceData} color="#4f46e5" emptyMessage="No device data available." />
        </div>

        {/* Browsers (D3 Bar Chart) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Browsers weight="duotone" className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Browser Distribution</h3>
          </div>
          <D3BarChart data={browserData} color="#818cf8" emptyMessage="No browser data available." />
        </div>
      </div>
    </div>
  )
}