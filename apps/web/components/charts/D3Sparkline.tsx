'use client'

import React, { useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'

export interface SparklineDataPoint {
  value: number
  label?: string
}

interface D3SparklineProps {
  data: number[] | SparklineDataPoint[]
  width?: number
  height?: number
  color?: string
  fillColor?: string
  showGradient?: boolean
  showMinMax?: boolean
  showTooltip?: boolean
  strokeWidth?: number
  className?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function D3Sparkline({
  data,
  width = 120,
  height = 36,
  color = '#4f46e5',
  showGradient = true,
  showMinMax = false,
  showTooltip = true,
  strokeWidth = 2,
  className = '',
}: D3SparklineProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; label?: string } | null>(null)

  // Normalize points
  const points: SparklineDataPoint[] = useMemo(() => {
    if (!data || data.length === 0) {
      return [{ value: 0 }, { value: 0 }]
    }
    if (typeof data[0] === 'number') {
      return (data as number[]).map((v, i) => ({ value: v, label: `Index ${i}` }))
    }
    return data as SparklineDataPoint[]
  }, [data])

  const margin = { top: 4, right: 4, bottom: 4, left: 4 }
  const innerWidth = Math.max(10, width - margin.left - margin.right)
  const innerHeight = Math.max(10, height - margin.top - margin.bottom)

  const { pathD, areaD, coordinates, minPoint, maxPoint } = useMemo(() => {
    if (points.length === 0) return { pathD: '', areaD: '', coordinates: [], minPoint: null, maxPoint: null }

    const values = points.map(p => p.value)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const yDomain = minVal === maxVal ? [minVal - 1, maxVal + 1] : [minVal, maxVal]

    const xScale = d3
      .scaleLinear()
      .domain([0, points.length - 1])
      .range([margin.left, margin.left + innerWidth])

    const yScale = d3
      .scaleLinear()
      .domain(yDomain)
      .range([margin.top + innerHeight, margin.top])

    const lineGenerator = d3
      .line<SparklineDataPoint>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    const areaGenerator = d3
      .area<SparklineDataPoint>()
      .x((_, i) => xScale(i))
      .y0(margin.top + innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX)

    const coords = points.map((p, i) => ({
      x: xScale(i),
      y: yScale(p.value),
      value: p.value,
      label: p.label,
    }))

    let minP = coords[0]
    let maxP = coords[0]
    coords.forEach(p => {
      if (p.value < minP.value) minP = p
      if (p.value > maxP.value) maxP = p
    })

    return {
      pathD: lineGenerator(points) || '',
      areaD: areaGenerator(points) || '',
      coordinates: coords,
      minPoint: minP,
      maxPoint: maxP,
    }
  }, [points, innerWidth, innerHeight, margin.left, margin.top])

  const gradientId = useMemo(() => `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`, [])

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip || !svgRef.current || coordinates.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * width

    // Find closest point
    let closest = coordinates[0]
    let minDist = Math.abs(coordinates[0].x - mouseX)
    for (let i = 1; i < coordinates.length; i++) {
      const dist = Math.abs(coordinates[i].x - mouseX)
      if (dist < minDist) {
        minDist = dist
        closest = coordinates[i]
      }
    }
    setHoveredPoint(closest)
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  return (
    <div className={`relative inline-block ${className}`} style={{ width, height }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible block w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Gradient fill */}
        {showGradient && areaD && (
          <path d={areaD} fill={`url(#${gradientId})`} pointerEvents="none" />
        )}

        {/* Spline Path */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}

        {/* Min / Max indicators */}
        {showMinMax && minPoint && maxPoint && minPoint.x !== maxPoint.x && (
          <>
            <circle cx={minPoint.x} cy={minPoint.y} r={2.5} fill="#ef4444" stroke="#ffffff" strokeWidth={1} />
            <circle cx={maxPoint.x} cy={maxPoint.y} r={2.5} fill="#10b981" stroke="#ffffff" strokeWidth={1} />
          </>
        )}

        {/* Hover marker */}
        {hoveredPoint && (
          <>
            <line
              x1={hoveredPoint.x}
              y1={margin.top}
              x2={hoveredPoint.x}
              y2={margin.top + innerHeight}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.6}
            />
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r={3.5}
              fill={color}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          </>
        )}
      </svg>

      {/* Hover tooltip */}
      {hoveredPoint && (
        <div
          className="pointer-events-none absolute -top-8 z-30 transform -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white shadow-md"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
          }}
        >
          {hoveredPoint.value} {hoveredPoint.label && !hoveredPoint.label.startsWith('Index') ? `(${hoveredPoint.label})` : ''}
        </div>
      )}
    </div>
  )
}
