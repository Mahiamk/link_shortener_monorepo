"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ClickOverTimeStat } from "@/lib/api" // Adjust path if needed

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart" // Adjust path if needed

// Define the chart configuration specifically for clicks
const chartConfig = {
  clicks: {
    label: "Clicks",
    color: "hsl(var(--chart-1))", // Or use a different chart color if desired
  },
} satisfies ChartConfig

// Define props for the component
interface ClicksOverTimeChartProps {
  chartData: ClickOverTimeStat[];
  timeRange: 'day' | 'month' | 'year';
}

export function ClicksOverTimeChart({ chartData, timeRange }: ClicksOverTimeChartProps) {

  // Format the date for the X-axis based on the selected interval
  const formatXAxisTick = (value: string) => {
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) return value;

      if (timeRange === 'year') {
        return date.toLocaleDateString("en-US", { year: "numeric" })
      } else if (timeRange === 'month') {
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      } else { // day
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      }
    } catch (e) {
      console.error("Error formatting date:", value, e);
      return value;
    }
  }

  // Format the label in the tooltip
  const formatTooltipLabel = (value: string) => {
     try {
       const date = new Date(value)
       if (isNaN(date.getTime())) return value;

       if (timeRange === 'year') {
        return date.toLocaleDateString("en-US", { year: "numeric" })
      } else if (timeRange === 'month') {
        return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      } else { // day
        return date.toLocaleDateString("en-US", { weekday: 'long', month: "short", day: "numeric", year: "numeric"})
      }
     } catch(e) {
        return value;
     }
  }

  // Handle empty data state within the chart component
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
        <p className="text-sm text-gray-500">No click data available for this period.</p>
      </div>
    );
  }

  return (
    // Note: Removed Card wrapper, assuming it's handled by the parent AnalysisPage
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full"
    >
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-clicks)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-clicks)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3"/>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatXAxisTick}
          interval={0} // Try to show all labels
          // Consider adding angle={-30} textAnchor="end" height={50} if labels overlap
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={formatTooltipLabel}
              indicator="dot"
              nameKey="count" // Use the count field
              label="Clicks"    // Set label for the value
            />
          }
        />
        <Area
          dataKey="count" // Use 'count' from the API response
          type="natural"
          fill="url(#fillClicks)"
          stroke="var(--color-clicks)" // Make sure --color-clicks matches chartConfig
          stackId="a" // Not strictly needed for single area, but good practice
          name="Clicks" // Name for tooltip/legend
        />
      </AreaChart>
    </ChartContainer>
  )
}