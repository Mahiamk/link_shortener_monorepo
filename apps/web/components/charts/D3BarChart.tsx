'use client'

import React, { useMemo } from 'react'

export interface BarDataItem {
  name: string
  value: number
}

interface D3BarChartProps {
  data: Record<string, number> | BarDataItem[]
  color?: string
  emptyMessage?: string
  maxItems?: number
}

export function D3BarChart({
  data,
  color = '#4f46e5',
  emptyMessage = 'No data available',
  maxItems = 5,
}: D3BarChartProps) {
  const items: BarDataItem[] = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data.filter((d) => d.value > 0).slice(0, maxItems)
    return Object.entries(data)
      .map(([name, value]) => ({ name: name || 'Unknown', value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, maxItems)
  }, [data, maxItems])

  const maxVal = useMemo(() => Math.max(1, ...items.map((d) => d.value)), [items])
  const total = useMemo(() => items.reduce((acc, curr) => acc + curr.value, 0), [items])

  if (items.length === 0) {
    return (
      <div className="flex h-[180px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
        <p className="text-xs font-medium text-slate-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3.5 pt-1">
      {items.map((item, idx) => {
        const pctOfMax = (item.value / maxVal) * 100
        const pctOfTotal = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'

        return (
          <div key={idx} className="group">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700 truncate max-w-[180px]">{item.name}</span>
              <div className="flex items-center gap-1.5 tabular-nums">
                <span className="font-bold text-slate-900">{item.value}</span>
                <span className="text-[11px] text-slate-400">({pctOfTotal}%)</span>
              </div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out group-hover:brightness-110"
                style={{
                  width: `${Math.max(4, pctOfMax)}%`,
                  backgroundColor: idx === 0 ? color : `${color}cc`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
