"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts" 

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card" 
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,      
  ChartLegendContent 
} from "@/components/ui/chart" 

// --- Define Types ---
type DeviceDataPoint = {
  device: string; 
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
    "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
    "hsl(var(--chart-4))", "hsl(var(--chart-5))",
  ];
  return colors[index % colors.length];
};

// --- Main Chart Component ---
export function DeviceLineChart({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: Record<string, number>;
}) {
  const chartData: DeviceDataPoint[] = React.useMemo(() => Object.entries(data)
    .map(([name, count]) => ({
      device: name || 'Unknown',
      count: count,
    }))
    .sort((a, b) => b.count - a.count), 
    [data]);

  const chartConfig: GenericChartConfig = React.useMemo(() => chartData.reduce((acc, item, index) => {
    const safeKey = item.device.replace(/[^a-zA-Z0-9]/g, '_');
    acc[safeKey] = { label: item.device, color: generateColor(index) };
    return acc;
  }, {} as GenericChartConfig), [chartData]);

  const rechartsData = React.useMemo(() => {
    const singlePoint = chartData.reduce((acc, item) => {
      const safeKey = item.device.replace(/[^a-zA-Z0-9]/g, '_');
      acc[safeKey] = item.count;
      return acc;
    }, { category: 'Device Types' } as { category: string; [key: string]: number | string }); 
    return [singlePoint];
  }, [chartData]);


  if (chartData.length === 0) {
     return (
       <Card>
         <CardHeader> <CardTitle>{title}</CardTitle> <CardDescription>{description}</CardDescription> </CardHeader>
         <CardContent> <p className="text-center text-gray-500 py-10">No data available yet.</p> </CardContent>
       </Card>
     )
  }

  // Define dynamic CSS variables
  const dynamicStyles = chartData.reduce((acc, item, index) => {
    const safeKey = item.device.replace(/[^a-zA-Z0-9]/g, '_');
    acc[`--color-${safeKey}`] = generateColor(index);
    return acc;
  }, {} as React.CSSProperties);

  return (
    <Card style={dynamicStyles}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Adjusted ChartContainer height */}
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          {/* Line Chart */}
          <LineChart
            accessibilityLayer
            data={rechartsData} 
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            {/* XAxis - represents the single data point category */}
            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
             hide
            />
             {/* YAxis shows the count */}
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />

            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
             <ChartLegend content={<ChartLegendContent />} />

            {/* Render a <Line> for each device type */}
            {chartData.map((item) => {
              const safeKey = item.device.replace(/[^a-zA-Z0-9]/g, '_');
              return (
                <Line
                  key={safeKey}
                  dataKey={safeKey}
                  type="monotone"
                  stroke={`var(--color-${safeKey})`}
                  strokeWidth={2}
                  dot={true}
                  name={chartConfig[safeKey]?.label || item.device}
                />
            )})}
          </LineChart>
        </ChartContainer>
      </CardContent>
      {/* Optional Footer */}
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="text-muted-foreground grid gap-2">
            Clicks recorded by device type
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}