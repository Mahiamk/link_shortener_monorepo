'use client'

import React, { useRef, useState, useMemo, useEffect } from 'react'
import * as d3 from 'd3'

export interface D3AreaChartData {
  date: string
  count: number
  label?: string
}

interface D3AreaChartProps {
  data: D3AreaChartData[]
  timeRange?: 'day' | 'month' | 'year'
  height?: number
  color?: string
  yAxisLabel?: string
  emptyMessage?: string
}

export function D3AreaChart({
  data,
  timeRange = 'day',
  height = 300,
  color = '#4f46e5',
  yAxisLabel = 'Clicks',
  emptyMessage = 'No data available for this period.',
}: D3AreaChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(600)
  const [hoveredData, setHoveredData] = useState<{
    x: number
    y: number
    date: string
    count: number
  } | null>(null)

  // Measure container width responsively
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width)
        }
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const margin = { top: 20, right: 20, bottom: 35, left: 45 }
  const innerWidth = Math.max(50, containerWidth - margin.left - margin.right)
  const innerHeight = Math.max(50, height - margin.top - margin.bottom)

  const formatTickDate = (dStr: string) => {
    try {
      const date = new Date(dStr)
      if (isNaN(date.getTime())) return dStr
      if (timeRange === 'year') {
        return date.toLocaleDateString('en-US', { year: 'numeric' })
      } else if (timeRange === 'month') {
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    } catch {
      return dStr
    }
  }

  const formatFullDate = (dStr: string) => {
    try {
      const date = new Date(dStr)
      if (isNaN(date.getTime())) return dStr
      if (timeRange === 'year') {
        return date.toLocaleDateString('en-US', { year: 'numeric' })
      } else if (timeRange === 'month') {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      } else {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      }
    } catch {
      return dStr
    }
  }

  const { pathD, areaD, yTicks, xTicks, points, maxVal } = useMemo(() => {
    if (!data || data.length === 0) {
      return { pathD: '', areaD: '', yTicks: [], xTicks: [], points: [], maxVal: 0 }
    }

    const counts = data.map((d) => d.count)
    const max = Math.max(5, d3.max(counts) || 0)

    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([margin.left, margin.left + innerWidth])

    const yScale = d3
      .scaleLinear()
      .domain([0, max * 1.1])
      .nice()
      .range([margin.top + innerHeight, margin.top])

    const lineGen = d3
      .line<D3AreaChartData>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.count))
      .curve(d3.curveMonotoneX)

    const areaGen = d3
      .area<D3AreaChartData>()
      .x((_, i) => xScale(i))
      .y0(margin.top + innerHeight)
      .y1((d) => yScale(d.count))
      .curve(d3.curveMonotoneX)

    const pts = data.map((d, i) => ({
      x: xScale(i),
      y: yScale(d.count),
      date: d.date,
      count: d.count,
    }))

    // Calculate nice Y ticks
    const yTicksArr = yScale.ticks(5).map((val) => ({
      val,
      y: yScale(val),
    }))

    // Calculate X ticks (downsample if too crowded)
    const step = Math.max(1, Math.ceil(data.length / (innerWidth < 500 ? 5 : 8)))
    const xTicksArr = data
      .map((d, i) => ({
        index: i,
        date: d.date,
        x: xScale(i),
      }))
      .filter((_, i) => i % step === 0 || i === data.length - 1)

    return {
      pathD: lineGen(data) || '',
      areaD: areaGen(data) || '',
      yTicks: yTicksArr,
      xTicks: xTicksArr,
      points: pts,
      maxVal: max,
    }
  }, [data, innerWidth, innerHeight, margin.left, margin.top])

  const gradId = useMemo(() => `d3-area-grad-${Math.random().toString(36).substr(2, 9)}`, [])

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left

    let closest = points[0]
    let minDist = Math.abs(points[0].x - mouseX)
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - mouseX)
      if (dist < minDist) {
        minDist = dist
        closest = points[i]
      }
    }
    setHoveredData(closest)
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
        <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg
        width={containerWidth}
        height={height}
        className="overflow-visible cursor-crosshair block"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredData(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="90%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={margin.left}
              y1={tick.y}
              x2={margin.left + innerWidth}
              y2={tick.y}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
            />
            <text
              x={margin.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              className="text-[11px] fill-slate-400 font-medium"
            >
              {tick.val}
            </text>
          </g>
        ))}

        {/* X Axis ticks */}
        {xTicks.map((tick, i) => (
          <text
            key={i}
            x={tick.x}
            y={margin.top + innerHeight + 20}
            textAnchor="middle"
            className="text-[11px] fill-slate-400 font-medium"
          >
            {formatTickDate(tick.date)}
          </text>
        ))}

        {/* Area fill */}
        {areaD && <path d={areaD} fill={`url(#${gradId})`} pointerEvents="none" />}

        {/* Line curve */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}

        {/* Hover elements */}
        {hoveredData && (
          <g pointerEvents="none">
            {/* Vertical crosshair */}
            <line
              x1={hoveredData.x}
              y1={margin.top}
              x2={hoveredData.x}
              y2={margin.top + innerHeight}
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            {/* Outer glow circle */}
            <circle cx={hoveredData.x} cy={hoveredData.y} r={7} fill={color} opacity={0.2} />
            {/* Inner dot */}
            <circle cx={hoveredData.x} cy={hoveredData.y} r={4} fill={color} stroke="#ffffff" strokeWidth={2} />
          </g>
        )}
      </svg>

      {/* Floating Tooltip */}
      {hoveredData && (
        <div
          className="pointer-events-none absolute z-20 transform -translate-x-1/2 -translate-y-full rounded-xl bg-slate-900 px-3.5 py-2 text-xs text-white shadow-xl shadow-slate-950/20 backdrop-blur"
          style={{
            left: `${hoveredData.x}px`,
            top: `${hoveredData.y - 12}px`,
          }}
        >
          <div className="font-semibold text-slate-200">{formatFullDate(hoveredData.date)}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-indigo-300 font-bold">
            <span className="h-2 w-2 rounded-full bg-indigo-400" />
            <span>{hoveredData.count} {yAxisLabel}</span>
          </div>
        </div>
      )}
    </div>
  )
}
