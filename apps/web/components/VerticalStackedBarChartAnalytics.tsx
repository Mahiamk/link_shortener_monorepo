"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

// --- Define Types ---
type ChartDataPoint = {
  name: string;
  count: number;
}

type GenericChartConfig = {
  [key: string]: {
    label: string;
    color: string;
  };
}

// --- Helper Functions ---
const generateColor = (index: number): string => {
  const colors = [
    "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
    "var(--chart-4)", "var(--chart-5)",
    "var(--chart-6, 210 40% 50%)", "var(--chart-7, 160 60% 45%)",
  ];
  return colors[index % colors.length];
};

// --- Main Chart Component ---
export function VerticalStackedBarChartAnalytics({
  title,
  description,
  data,
  dataKey
}: {
  title: string;
  description: string;
  data: Record<string, number>;
  dataKey: string;
}) {
  const chartData: ChartDataPoint[] = React.useMemo(() => Object.entries(data)
    .map(([name, count]) => ({
      name: name || 'Unknown',
      count: count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5), [data]);

  const chartConfig: GenericChartConfig = React.useMemo(() => chartData.reduce((acc, item, index) => {
    const safeKey = item.name.replace(/[^a-zA-Z0-9]/g, '_');
    acc[safeKey] = { label: item.name, color: generateColor(index) };
    return acc;
  }, {} as GenericChartConfig), [chartData]);

  const rechartsData = React.useMemo(() => chartData.map(item => ({
      category: item.name,
      count: item.count,
      fill: `var(--color-${item.name.replace(/[^a-zA-Z0-9]/g, '_')})`
    })
  ), [chartData]);

  if (chartData.length === 0) {
     return (
       <Card> <CardHeader> <CardTitle>{title}</CardTitle> <CardDescription>{description}</CardDescription> </CardHeader>
         <CardContent> <p className="text-center text-gray-500 py-10">No data available yet.</p> </CardContent>
       </Card>
     )
  }

  const dynamicStyles = chartData.reduce((acc, item, index) => {
    const safeKey = item.name.replace(/[^a-zA-Z0-9]/g, '_');
    acc[`--color-${safeKey}`] = generateColor(index);
    return acc;
  }, {} as Record<string, string>);

  return (
    <Card style={dynamicStyles as React.CSSProperties}>
      <CardHeader> <CardTitle>{title}</CardTitle> <CardDescription>{description}</CardDescription> </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={rechartsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="category" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
            <YAxis hide/>
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="text-muted-foreground leading-none"> Showing top 5 sources </div>
      </CardFooter>
    </Card>
  )
}
