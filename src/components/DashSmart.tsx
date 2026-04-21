import React, { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAllSheets } from '../hooks/useAllSheets'
import {
  METRIC_LABELS,
  transformMonthSheet,
  type MetricKey,
  type MonthComparison,
} from '../utils/conversionSheet'

const METRIC_ORDER: MetricKey[] = ['calls', 'open50', 'openRate', 'rdv', 'convRate']

// Distinct (Bilal, Romain) color pair per chart so each metric is visually unique.
const METRIC_COLORS: Record<MetricKey, { bilal: string; romain: string }> = {
  calls: { bilal: '#1B7ED4', romain: '#F97316' }, // blue / orange
  open50: { bilal: '#10B981', romain: '#EF4444' }, // emerald / red
  openRate: { bilal: '#8B5CF6', romain: '#F59E0B' }, // violet / amber
  rdv: { bilal: '#0EA5E9', romain: '#EC4899' }, // sky / pink
  convRate: { bilal: '#14B8A6', romain: '#F43F5E' }, // teal / rose
}

interface ChartCardProps {
  metric: MetricKey
  data: MonthComparison['metrics'][MetricKey]
}

/**
 * Computes the simple arithmetic mean of non-null values for a given person.
 * Returns null if no data points are available.
 */
function computeAverage(
  data: MonthComparison['metrics'][MetricKey],
  who: 'Bilal' | 'Romain',
): number | null {
  const values = data
    .map((d) => d[who])
    .filter((v): v is number => v !== null && v !== undefined)
  if (values.length === 0) return null
  const sum = values.reduce((acc, v) => acc + v, 0)
  return sum / values.length
}

function formatAvg(value: number | null, unit: string): string {
  if (value === null) return '—'
  // One decimal is enough; drop the trailing ".0" for integers
  const rounded = Math.round(value * 10) / 10
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return unit ? `${str}${unit}` : str
}

const ChartCard: React.FC<ChartCardProps> = ({ metric, data }) => {
  const { label, unit } = METRIC_LABELS[metric]
  const { bilal, romain } = METRIC_COLORS[metric]

  const avgBilal = computeAverage(data, 'Bilal')
  const avgRomain = computeAverage(data, 'Romain')

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-center text-sm font-semibold text-gray-700">
        {label} {unit && <span className="text-gray-400">({unit})</span>}
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(v: number) => (unit ? `${v}${unit}` : String(v))}
            />
            <Tooltip
              formatter={(value) => {
                if (value === null || value === undefined) return '—'
                return unit ? `${value}${unit}` : (value as number | string)
              }}
              labelFormatter={(day) => `Jour ${day}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="Bilal"
              stroke={bilal}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="Romain"
              stroke={romain}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Averages — shown under each person's name */}
      <div className="mt-2 flex items-center justify-center gap-8 border-t border-gray-100 pt-2">
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-semibold" style={{ color: bilal }}>
            Bilal
          </span>
          <span className="text-xs font-bold text-gray-700 tabular-nums">
            Moy. {formatAvg(avgBilal, unit)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-semibold" style={{ color: romain }}>
            Romain
          </span>
          <span className="text-xs font-bold text-gray-700 tabular-nums">
            Moy. {formatAvg(avgRomain, unit)}
          </span>
        </div>
      </div>
    </div>
  )
}

const DashSmart: React.FC = () => {
  const { sheets, loading, error } = useAllSheets()

  // Pre-transform each sheet once into a chart-ready MonthComparison.
  const months = useMemo(
    () => sheets.map((s) => transformMonthSheet(s.title, s.rows)),
    [sheets],
  )

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  // Default to the last (most recent) month when data arrives.
  useEffect(() => {
    if (!selectedMonth && months.length > 0) {
      setSelectedMonth(months[months.length - 1].month)
    }
  }, [months, selectedMonth])

  useEffect(() => {
    if (loading) return
    if (error) {
      console.error('[DashSmart] error:', error)
      return
    }
    console.log('[DashSmart] months:', months)
  }, [months, loading, error])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Chargement des données…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-red-500">
        {error}
      </div>
    )
  }

  const current = months.find((m) => m.month === selectedMonth) ?? months[0]
  if (!current) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Aucune feuille disponible
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto p-6">
      {/* Header with month tabs */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Suivi du taux de conversion</h1>
          <p className="text-xs text-gray-400">Comparaison journalière Bilal vs Romain</p>
        </div>

        <label className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Mois</span>
          <select
            value={current.month}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:border-[#1B7ED4] focus:outline-none focus:ring-2 focus:ring-[#1B7ED4]/20"
          >
            {months.map((m) => (
              <option key={m.month} value={m.month}>
                {m.month}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Chart grid — 2 cols on large screens, 1 col on mobile */}
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {METRIC_ORDER.map((metric) => (
          <ChartCard key={metric} metric={metric} data={current.metrics[metric]} />
        ))}
      </div>
    </div>
  )
}

export default DashSmart
