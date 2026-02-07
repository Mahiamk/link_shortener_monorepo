"use client"

import * as React from "react"
import { LabelList, Pie, PieChart } from "recharts"

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
  ChartLegendContent,
} from "@/components/ui/chart" 

// --- Define Types ---
type CountryDataPoint = {
  country: string; 
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
    "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
    "var(--chart-4)", "var(--chart-5)",
  ];
  return colors[index % colors.length];
};

// --- Main Chart Component ---
export function CountryPieChart({
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
      name: name || 'Unknown',
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

  // 2. Format for Recharts Pie Chart
  const chartData: CountryDataPoint[] = React.useMemo(() => topData.map((item) => {
      const safeKey = item.name.replace(/[^a-zA-Z0-9]/g, '_');
      return {
        country: item.name,
        count: item.count,
        fill: `var(--color-${safeKey})`,
      };
    }), [topData]);


  if (chartData.length === 0) {
     return (
       <Card>
         <CardHeader className="items-center pb-0"> <CardTitle>{title}</CardTitle> <CardDescription>{description}</CardDescription> </CardHeader>
         <CardContent> <p className="text-center text-gray-500 py-10">No data available yet.</p> </CardContent>
       </Card>
     )
  }

  // Define dynamic CSS variables needed for the fill
  const dynamicStyles = chartData.reduce((acc, item, index) => {
    const safeKey = item.country.replace(/[^a-zA-Z0-9]/g, '_');
    acc[`--color-${safeKey}`] = generateColor(index);
    return acc;
  }, {} as Record<string, string>);


  return (
    <Card className="flex flex-col" style={dynamicStyles}>
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          // Added class for white text on labels
          className="[&_.recharts-label-list]:stroke-none [&_.recharts-label-list]:fill-white mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="count" hideLabel />} />
            <ChartLegend content={<ChartLegendContent nameKey="country"/>} />
            <Pie data={chartData} dataKey="count" innerRadius={50} outerRadius={80}>
              <LabelList
                dataKey="country"
                className="fill-background" 
                stroke="none"
                fontSize={10} 
                formatter={(value: string) => {
                  const safeKey = value.replace(/[^a-zA-Z0-9]/g, '_');
                  const label = chartConfig[safeKey]?.label || value;
                  return label.length > 8 ? `${label.substring(0,6)}...` : label; // Truncate long labels
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="text-muted-foreground leading-none">
           Showing top 5 countries + Other
        </div>
      </CardFooter>
    </Card>
  )
}