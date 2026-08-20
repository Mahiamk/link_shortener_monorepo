'use client'

import { useEffect, useState, useMemo } from 'react'
import { getAdminStats, AdminStats } from '@/lib/api'
import { Users, LinkSimple, ChartBar, CircleNotch } from '@phosphor-icons/react'
import { UserRegistrationChart } from '@/components/admin/UserRegistrationChart'
import { D3Sparkline } from '@/components/charts/D3Sparkline'

function StatCard({
  title,
  value,
  icon,
  sparklineData,
  color,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  sparklineData: number[]
  color: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div>
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-extrabold text-slate-900 tabular-nums">{value}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          {icon}
        </div>
        <D3Sparkline data={sparklineData} width={80} height={26} color={color} />
      </div>
    </div>
  )
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No token found. Please log in.')
        setLoading(false)
        return
      }

      try {
        const data = await getAdminStats(token)
        setStats(data)
      } catch (err) {
        console.error(err)
        setError('Failed to fetch admin statistics.')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const userSparkline = useMemo(() => {
    const u = stats?.total_users || 8
    return [Math.max(1, u - 4), Math.max(2, u - 2), u]
  }, [stats])

  const linkSparkline = useMemo(() => {
    const l = stats?.total_links || 6
    return [Math.max(1, l - 3), Math.max(2, l - 1), l]
  }, [stats])

  const clickSparkline = useMemo(() => {
    const c = stats?.total_clicks || 2
    return [Math.max(0, c - 2), Math.max(1, c - 1), c]
  }, [stats])

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center text-slate-400">
        <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs">Loading admin overview...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-10">
        <p className="text-xs font-semibold text-rose-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Admin Overview
        </h1>
      </div>

      {/* ── Stat Cards (matching admin.png) ────────────────────────── */}
      {stats ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon={<Users weight="duotone" className="h-6 w-6 text-indigo-600" />}
            sparklineData={userSparkline}
            color="#4f46e5"
          />
          <StatCard
            title="Total Links"
            value={stats.total_links}
            icon={<LinkSimple weight="duotone" className="h-6 w-6 text-indigo-600" />}
            sparklineData={linkSparkline}
            color="#6366f1"
          />
          <StatCard
            title="Total Clicks"
            value={stats.total_clicks}
            icon={<ChartBar weight="duotone" className="h-6 w-6 text-emerald-600" />}
            sparklineData={clickSparkline}
            color="#10b981"
          />
        </div>
      ) : (
        <p className="text-xs text-slate-400">No statistics available.</p>
      )}

      {/* ── User Registration D3 Chart (matching admin.png) ─────────── */}
      <div>
        <UserRegistrationChart />
      </div>

      {/* ── Site Management Info ────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900">Site Management</h3>
        <p className="mt-1 text-xs text-slate-500">
          Use the sidebar navigation to manage users, inspect shortened links, or review contact submissions.
        </p>
      </div>
    </div>
  )
}