'use client'

import { useEffect, useState } from 'react'
import { getAdminStats, AdminStats } from '../../../lib/api' // Adjust path
import { BarChart2, Link as LinkIcon, Users } from 'lucide-react'
import { UserRegistrationChart } from '@/components/admin/UserRegistrationChart'

// --- Reusable Stat Card Component ---
function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
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

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError("No token found. Please log in.")
        setLoading(false)
        return
      }

      try {
        const data = await getAdminStats(token)
        setStats(data)
      } catch (err) {
        console.error(err)
        setError("Failed to fetch admin statistics. You may not have permission.")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">Loading admin overview...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">
        Admin Overview
      </h2>

      {stats ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            title="Total Links"
            value={stats.total_links}
            icon={<LinkIcon className="h-5 w-5" />}
          />
          <StatCard
            title="Total Clicks"
            value={stats.total_clicks}
            icon={<BarChart2 className="h-5 w-5" />}
          />
        </div>
      ) : (
        <p className="text-gray-500">No statistics available.</p>
      )}

      <div className="mt-10">
        <UserRegistrationChart />
      </div>
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-gray-900">
          Site Management
        </h3>
        <p className="mt-2 text-gray-600">
          Use the sidebar navigation to manage users, view all links, or check site health.
        </p>
      </div>
    </div>

  )
}