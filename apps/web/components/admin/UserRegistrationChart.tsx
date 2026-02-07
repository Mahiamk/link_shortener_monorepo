"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts" 
import { getUserRegistrationStats, RegistrationStat } from "@/lib/api" 

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react"

// Define the chart configuration
const chartConfig = {
  users: {
    label: "New Users",
    color: "var(--chart-1)", // Use Shadcn's CSS variables for color
  },
} satisfies ChartConfig

export function UserRegistrationChart() {
  const [timeRange, setTimeRange] = useState<"day" | "month" | "year">("day")
  const [chartData, setChartData] = useState<RegistrationStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError("Not authenticated.")
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const data = await getUserRegistrationStats(token, timeRange)
        setChartData(data || [])
      } catch (err) {
        console.error("Failed to fetch registration stats:", err)
        setError("Could not load registration data.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [timeRange]) // Re-fetch when timeRange changes

  const formatXAxisTick = (value: string) => {
    const date = new Date(value)
    if (timeRange === 'year') {
      return date.toLocaleDateString("en-US", { year: "numeric" })
    } else if (timeRange === 'month') {
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    } else { // day
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const formatTooltipLabel = (value: string) => {
     const date = new Date(value)
     if (timeRange === 'year') {
      return date.toLocaleDateString("en-US", { year: "numeric" })
    } else if (timeRange === 'month') {
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    } else {
      return date.toLocaleDateString("en-US", { weekday: 'long', month: "short", day: "numeric", year: "numeric"})
    }
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>User Registrations</CardTitle>
          <CardDescription>
            Showing new user signups over time
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as "day" | "month" | "year")}>
          <SelectTrigger
            className="w-[120px] rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Select interval" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="day" className="rounded-lg">Daily</SelectItem>
            <SelectItem value="month" className="rounded-lg">Monthly</SelectItem>
            <SelectItem value="year" className="rounded-lg">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading && <p className="text-center text-gray-500 py-10">Loading chart data...</p>}
        {error && <p className="text-center text-gray-500 py-10">{error}</p>}
        {!loading && !error && chartData.length === 0 && (
          <p className="text-center text-gray-500 py-10">No registration data found for this period.</p>
        )}
        {!loading && !error && chartData.length > 0 && (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-users)" 
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-users)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3"/>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={timeRange === 'day' ? 32 : 10} 
                tickFormatter={formatXAxisTick}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} /> 
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={formatTooltipLabel}
                    indicator="dot"
                    nameKey="count" 
                  />
                }
              />
              <Area
                dataKey="count" 
                type="natural"
                fill="url(#fillUsers)"
                stroke="var(--color-users)"
                stackId="a" 
                name="New Users" 
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}