/**
 * Transforms raw CSV rows from the "Suivi du taux de conversion" sheet into
 * chart-ready data for comparing Bilal vs Romain, day by day.
 *
 * Sheet layout (per month tab):
 *   Col  0 : Jours (Bilal)
 *   Col  1 : Nb d'appels (Bilal)
 *   Col  2 : Open 50s (Bilal)
 *   Col  3 : Open rate % (Bilal)
 *   Col  4 : Rdv booké (Bilal)
 *   Col  5 : % Conv (Bilal)
 *   Col  6 : <separator>
 *   Col  7 : Jours (Romain)
 *   Col  8 : Nb d'appels (Romain)
 *   Col  9 : Open 50s (Romain)
 *   Col 10 : Open rate % (Romain)
 *   Col 11 : Rdv booké (Romain)
 *   Col 12 : % Conv (Romain)
 *
 * First 2 rows are headers; last row is "Total".
 */

export type MetricKey = 'calls' | 'open50' | 'openRate' | 'rdv' | 'convRate'

export interface ComparisonPoint {
  day: number
  Bilal: number | null
  Romain: number | null
}

export interface MonthComparison {
  month: string
  metrics: Record<MetricKey, ComparisonPoint[]>
}

export const METRIC_LABELS: Record<MetricKey, { label: string; unit: string }> = {
  calls: { label: "Nb d'appels", unit: '' },
  open50: { label: 'Open 50s', unit: '' },
  openRate: { label: 'Open rate', unit: '%' },
  rdv: { label: 'Rdv booké', unit: '' },
  convRate: { label: '% Conv', unit: '%' },
}

/**
 * Parses a French-locale cell value into a number.
 *   "139,05"   → 139.05
 *   "16,18%"   → 16.18
 *   ""         → null
 *   "Total"    → null
 */
function parseNum(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const cleaned = raw.trim().replace('%', '').replace(/\s/g, '').replace(',', '.')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return isNaN(n) ? null : n
}

interface DayMetrics {
  day: number
  calls: number | null
  open50: number | null
  openRate: number | null
  rdv: number | null
  convRate: number | null
}

function parseDayBlock(row: string[], offset: number): DayMetrics | null {
  const day = parseNum(row[offset])
  if (day === null) return null
  return {
    day,
    calls: parseNum(row[offset + 1]),
    open50: parseNum(row[offset + 2]),
    openRate: parseNum(row[offset + 3]),
    rdv: parseNum(row[offset + 4]),
    convRate: parseNum(row[offset + 5]),
  }
}

const METRIC_KEYS: MetricKey[] = ['calls', 'open50', 'openRate', 'rdv', 'convRate']

export function transformMonthSheet(title: string, rows: string[][]): MonthComparison {
  // Skip the 2 header rows, drop the Total row and any empty rows.
  const dataRows = rows.slice(2).filter((r) => {
    const first = r[0]?.trim() ?? ''
    return first !== '' && first.toLowerCase() !== 'total'
  })

  const parsed = dataRows
    .map((row) => ({
      bilal: parseDayBlock(row, 0),
      romain: parseDayBlock(row, 7),
    }))
    .filter((p) => p.bilal !== null || p.romain !== null)

  const metrics = METRIC_KEYS.reduce((acc, key) => {
    acc[key] = parsed.map(({ bilal, romain }) => ({
      day: bilal?.day ?? romain?.day ?? 0,
      Bilal: bilal ? bilal[key] : null,
      Romain: romain ? romain[key] : null,
    }))
    return acc
  }, {} as Record<MetricKey, ComparisonPoint[]>)

  return { month: title, metrics }
}
