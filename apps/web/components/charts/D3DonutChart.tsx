'use client'

import React, { useMemo, useState } from 'react'
import * as d3 from 'd3'

export interface DonutDataItem {
  name: string
  value: number
}

interface D3DonutChartProps {
  data: Record<string, number> | DonutDataItem[]
  height?: number
  colors?: string[]
  title?: string
  emptyMessage?: string
}

const DEFAULT_COLORS = [
  '#4f46e5', // indigo-600
  '#818cf8', // indigo-400
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#64748b', // slate-500
]

export function D3DonutChart({
  data,
  height = 240,
  colors = DEFAULT_COLORS,
  emptyMessage = 'No data available',
}: D3DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Normalize data to array
  const items: DonutDataItem[] = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data.filter((d) => d.value > 0)
    return Object.entries(data)
      .map(([name, value]) => ({ name: name || 'Direct / None', value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [data])

  const total = useMemo(() => items.reduce((acc, curr) => acc + curr.value, 0), [items])

  const radius = Math.min(height, 220) / 2
  const innerRadius = radius * 0.62
  const outerRadius = radius * 0.92

  const arcs = useMemo(() => {
    if (items.length === 0) return []
    const pie = d3
      .pie<DonutDataItem>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.03)

    const arcGen = d3
      .arc<d3.PieArcDatum<DonutDataItem>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(4)

    const hoveredArcGen = d3
      .arc<d3.PieArcDatum<DonutDataItem>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius + 6)
      .cornerRadius(4)

    return pie(items).map((d, i) => ({
      path: arcGen(d) || '',
      hoveredPath: hoveredArcGen(d) || '',
      data: d.data,
      color: colors[i % colors.length],
      percentage: total > 0 ? ((d.data.value / total) * 100).toFixed(1) : '0',
    }))
  }, [items, innerRadius, outerRadius, colors, total])

  if (items.length === 0 || total === 0) {
    return (
      <div className="flex h-[200px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
        <p className="text-xs font-medium text-slate-500">{emptyMessage}</p>
      </div>
    )
  }

  const activeItem = hoveredIndex !== null ? arcs[hoveredIndex] : null

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      {/* SVG Donut */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} className="overflow-visible">
          <g transform={`translate(${radius}, ${radius})`}>
            {arcs.map((arc, i) => (
              <path
                key={i}
                d={hoveredIndex === i ? arc.hoveredPath : arc.path}
                fill={arc.color}
                className="cursor-pointer transition-all duration-200 ease-out"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </g>
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-slate-900 tabular-nums">
            {activeItem ? activeItem.data.value : total}
          </span>
          <span className="text-[11px] font-medium text-slate-500 max-w-[80px] truncate">
            {activeItem ? activeItem.data.name : 'Total Clicks'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="w-full space-y-2">
        {arcs.map((arc, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
              hoveredIndex === i ? 'bg-indigo-50/80 font-medium' : 'hover:bg-slate-50'
            }`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: arc.color }} />
              <span className="truncate text-slate-700">{arc.data.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              <span className="font-semibold text-slate-900">{arc.data.value}</span>
              <span className="text-[11px] text-slate-400">({arc.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
