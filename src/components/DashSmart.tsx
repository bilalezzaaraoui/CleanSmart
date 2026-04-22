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
  PERSONS,
  type MetricKey,
  type MonthComparison,
  type Person,
  type ShowRow,
  transformMonthSheet,
} from '../utils/conversionSheet'

// Display order for the 5 metric charts, matching the user-requested layout:
// Nb d'appel/Show · Nb d'appels · Open rate · Open 50s · Rdv booké · % Conv.
const METRIC_ORDER: MetricKey[] = ['calls', 'openRate', 'open50', 'rdv', 'convRate']

// Distinct color per (metric × person) so each line is visually unique within
// its own chart. Colors are intentionally reused across different metrics to
// keep the palette compact.
const METRIC_COLORS: Record<MetricKey, Record<Person, string>> = {
  calls: { Bilal: '#1B7ED4', Romain: '#F97316', Younes: '#10B981' }, // blue / orange / emerald
  open50: { Bilal: '#10B981', Romain: '#EF4444', Younes: '#6366F1' }, // emerald / red / indigo
  openRate: { Bilal: '#8B5CF6', Romain: '#F59E0B', Younes: '#0EA5E9' }, // violet / amber / sky
  rdv: { Bilal: '#0EA5E9', Romain: '#EC4899', Younes: '#22C55E' }, // sky / pink / green
  convRate: { Bilal: '#14B8A6', Romain: '#F43F5E', Younes: '#8B5CF6' }, // teal / rose / violet
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
  who: Person,
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
  const colors = METRIC_COLORS[metric]

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
            {PERSONS.map((p) => (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                stroke={colors[p]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Averages — shown under each person's name */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 border-t border-gray-100 pt-2">
        {PERSONS.map((p) => (
          <div key={p} className="flex flex-col items-center">
            <span className="text-[11px] font-semibold" style={{ color: colors[p] }}>
              {p}
            </span>
            <span className="text-xs font-bold text-gray-700 tabular-nums">
              Moy. {formatAvg(computeAverage(data, p), unit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ShowTableCardProps {
  rows: ShowRow[]
}

/**
 * Computes how many calls are needed to generate one show (ratio = calls/shows).
 * Returns null if any input is missing or if shows is 0 (avoid division by 0).
 */
function computeCallsPerShow(calls: number | null, shows: number | null): number | null {
  if (calls === null || shows === null || shows === 0) return null
  return calls / shows
}

/** Formats a ratio with one decimal, dropping trailing ".0" for integers. */
function formatRatio(value: number | null): string {
  if (value === null) return '—'
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/**
 * Renders the "Nb d'appel pour un Show" side-table. The block title sits at
 * the top of the card, and the table below lists every sales person with:
 *   Nom du sales · Nb d'appels · Nb de show · Nb d'appel / Show (ratio).
 */
const ShowTableCard: React.FC<ShowTableCardProps> = ({ rows }) => {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-center text-sm font-semibold text-gray-700">
        Nb d'appel pour un Show
      </h3>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-gray-400">
          Aucune donnée
        </div>
      ) : (
        // flex-1 stretches the wrapper to fill the remaining card height so the
        // inner table can match the neighbouring chart cards' vertical size.
        <div className="flex flex-1 flex-col overflow-hidden">
          <table className="h-full w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="w-2/5 px-3 py-2">Nom du sales</th>
                <th className="px-3 py-2 text-right">Nb d'appels</th>
                <th className="px-3 py-2 text-right">Nb de show</th>
                <th className="px-3 py-2 text-right">Appels / Show</th>
              </tr>
            </thead>
            {/*
              Setting table height:100% plus no fixed row heights lets the
              browser distribute leftover space evenly across tbody rows,
              producing a tidy "full bleed" table.
            */}
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, idx) => (
                <tr
                  key={r.name}
                  className={`transition-colors hover:bg-gray-50/80 ${
                    idx % 2 === 1 ? 'bg-gray-50/40' : ''
                  }`}
                >
                  <td className="px-3 align-middle font-semibold text-gray-800">
                    {r.name}
                  </td>
                  <td className="px-3 align-middle text-right tabular-nums text-gray-700">
                    {r.calls ?? '—'}
                  </td>
                  <td className="px-3 align-middle text-right tabular-nums text-gray-700">
                    {r.shows ?? '—'}
                  </td>
                  <td className="px-3 align-middle text-right font-bold tabular-nums text-gray-900">
                    {formatRatio(computeCallsPerShow(r.calls, r.shows))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
          <p className="text-xs text-gray-400">
            Comparaison journalière Bilal vs Romain vs Younes
          </p>
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

      {/* Chart grid — 2 cols on large screens, 1 col on mobile.
          5 charts + 1 show-table fill the 6-slot grid exactly.
          `auto-rows-fr` makes every row share the remaining vertical space
          equally so cards stretch to fill the container (no empty gap below).
          `mb-6` keeps a consistent breathing gap above the page bottom — in
          scrollable containers `padding-bottom` is often swallowed, whereas a
          margin on the last flex child is always honored. */}
      <div className="mb-6 grid flex-1 auto-rows-fr grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Show-table comes first, then the 5 metric charts in METRIC_ORDER. */}
        <ShowTableCard rows={current.showData} />
        {METRIC_ORDER.map((metric) => (
          <ChartCard key={metric} metric={metric} data={current.metrics[metric]} />
        ))}
      </div>
    </div>
  )
}

export default DashSmart
