"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ClickOverTimeStat } from "@/lib/api" 

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart" 

const chartConfig = {
  clicks: {
    label: "Clicks",
    color: "var(--chart-1)", // Or use a different chart color if desired
  },
} satisfies ChartConfig

// Define props for the component
interface ClicksOverTimeChartProps {
  chartData: ClickOverTimeStat[];
  timeRange: 'day' | 'month' | 'year';
}

export function ClicksOverTimeChart({ chartData, timeRange }: ClicksOverTimeChartProps) {

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
          interval={0} 
          
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={formatTooltipLabel}
              indicator="dot"
              nameKey="count" 
              label="Clicks"   
            />
          }
        />
        <Area
          dataKey="count" 
          type="natural"
          fill="url(#fillClicks)"
          stroke="var(--color-clicks)" 
          stackId="a" 
          name="Clicks" 
        />
      </AreaChart>
    </ChartContainer>
  )
}