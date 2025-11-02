"use client"

import * as React from "react"
import { Pie, PieChart } from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,        
  ChartLegendContent,
} from "@/components/ui/chart"

// --- Define Types ---
type ReferrerDataPoint = {
  referrer: string; 
  count: number;
  fill: string; 
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
export function ReferrerPieChart({
  title,
  description,
  data, 
}: {
  title: string;
  description: string;
  data: Record<string, number>;
}) {
  const sortedData = React.useMemo(() => Object.entries(data)
    .map(([name, count]) => ({
      name: name || 'Direct/Unknown',
      count: count,
    }))
    .sort((a, b) => b.count - a.count), [data]);

  const topData = sortedData.slice(0, 5);
  const otherCount = sortedData.slice(5).reduce((sum, item) => sum + item.count, 0);

  if (otherCount > 0 && topData.length > 0) {
    topData.push({ name: 'Other', count: otherCount });
  }

  const chartConfig: GenericChartConfig = React.useMemo(() => topData.reduce((acc, item, index) => {
    const safeKey = item.name.replace(/[^a-zA-Z0-9]/g, '_');
    acc[safeKey] = { label: item.name, color: generateColor(index) };
    return acc;
  }, {} as GenericChartConfig), [topData]);

  const chartData: ReferrerDataPoint[] = React.useMemo(() => topData.map((item) => {
      const safeKey = item.name.replace(/[^a-zA-Z0-9]/g, '_');
      return {
        referrer: item.name,
        count: item.count,
        fill: `var(--color-${safeKey})`,
      };
    }), [topData]);


  if (chartData.length === 0) {
     return (
       <Card className="flex flex-col">
         <CardHeader className="items-center pb-0"> <CardTitle>{title}</CardTitle> <CardDescription>{description}</CardDescription> </CardHeader>
         <CardContent className="flex-1 pb-0"> <p className="text-center text-gray-500 py-10">No data available yet.</p> </CardContent>
       </Card>
     )
  }

  // Define dynamic CSS variables needed for the fill
  const dynamicStyles = chartData.reduce((acc, item, index) => {
    const safeKey = item.referrer.replace(/[^a-zA-Z0-9]/g, '_');
    acc[`--color-${safeKey}`] = generateColor(index);
    return acc;
  }, {} as React.CSSProperties);

  return (
    <Card className="flex flex-col" style={dynamicStyles}>
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="count" />} />
            <ChartLegend content={<ChartLegendContent nameKey="referrer"/>} />
            <Pie
              data={chartData}
              dataKey="count"
              label={false}
              labelLine={false}
              nameKey="referrer"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              // Optional custom label formatting if 'label' prop is true
              // labelFormatter={(value: string, entry: { payload: ReferrerDataPoint }) => {
              //    const safeKey = entry.payload.referrer.replace(/[^a-zA-Z0-9]/g, '_');
              //    return chartConfig[safeKey]?.label || entry.payload.referrer;
              // }}
             />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4"> 
        <div className="text-muted-foreground leading-none">
          Showing top 5 referrers + Other
        </div>
      </CardFooter>
    </Card>
  )
}