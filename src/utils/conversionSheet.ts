/**
 * Transforms raw CSV rows from the "Suivi du taux de conversion" sheet into
 * chart-ready data for comparing Bilal vs Romain vs Younes, day by day.
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
 *   Col 13-15 : <notes / separator>
 *   Col 16 : Jours (Younes)
 *   Col 17 : Nb d'appels (Younes)
 *   Col 18 : Open 50s (Younes)
 *   Col 19 : Open rate % (Younes)
 *   Col 20 : Rdv booké (Younes)
 *   Col 21 : % Conv (Younes)
 *   Col 22 : <separator>
 *   Col 23 : Nom du sales    (table "Nb d'appel pour un Show")
 *   Col 24 : Nb d'appels     (total — toutes périodes confondues)
 *   Col 25 : Nb de show
 *   Col 26 : Date maj data   (populated only on the first row)
 *
 * First 2 rows are headers; last row is "Total".
 *
 * Weekend rows (samedi / dimanche) in the tab’s calendar month are dropped from
 * the Bilal / Romain / Younes charts; the show table is unchanged.
 */

export type Person = 'Bilal' | 'Romain' | 'Younes'

export type MetricKey = 'calls' | 'open50' | 'openRate' | 'rdv' | 'convRate'

export interface ComparisonPoint {
  day: number
  Bilal: number | null
  Romain: number | null
  Younes: number | null
}

export interface ShowRow {
  name: string
  calls: number | null
  shows: number | null
}

export interface MonthComparison {
  month: string
  metrics: Record<MetricKey, ComparisonPoint[]>
  showData: ShowRow[]
  /** "Date maj data" cell — only the first row of the show table carries it. */
  showUpdatedAt: string | null
}

export const PERSONS: Person[] = ['Bilal', 'Romain', 'Younes']

/** Starting column of each person's 6-column metric block. */
export const PERSON_OFFSETS: Record<Person, number> = {
  Bilal: 0,
  Romain: 7,
  Younes: 16,
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
 *   "#DIV/0!"  → null
 */
function parseNum(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const cleaned = raw.trim().replace('%', '').replace(/\s/g, '').replace(',', '.')
  if (cleaned === '' || cleaned.startsWith('#')) return null
  const n = Number(cleaned)
  return isNaN(n) ? null : n
}

/** Lowercase ASCII month name after stripping accents (février → fevrier). */
function normalizeFrenchMonthWord(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

/** Maps French month name (no accents) to JS month index 0–11. */
const FRENCH_MONTH_TO_INDEX: Record<string, number> = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
}

/**
 * Reads "Mars 2026" / "Avril 2026" from the sheet tab title (year at the end).
 * Returns null if the title does not match — weekend filtering is then skipped.
 */
function parseSheetCalendarMonth(title: string): { year: number; monthIndex: number } | null {
  const m = title.trim().match(/^(.+?)\s+(\d{4})\s*$/)
  if (!m) return null
  const monthKey = normalizeFrenchMonthWord(m[1])
  const year = Number(m[2])
  const monthIndex = FRENCH_MONTH_TO_INDEX[monthKey]
  if (monthIndex === undefined || !Number.isFinite(year)) return null
  return { year, monthIndex }
}

/**
 * True when (year, monthIndex, day) is a real calendar day in that month and
 * falls on Saturday or Sunday. Invalid dates (e.g. sheet quirks) return false
 * so we keep the row rather than dropping data incorrectly.
 */
function dayIsWeekendInSheetMonth(day: number, year: number, monthIndex: number): boolean {
  const d = new Date(year, monthIndex, day)
  if (d.getFullYear() !== year || d.getMonth() !== monthIndex || d.getDate() !== day) {
    return false
  }
  const dow = d.getDay()
  return dow === 0 || dow === 6
}

interface DayMetrics {
  day: number
  calls: number | null
  open50: number | null
  openRate: number | null
  rdv: number | null
  convRate: number | null
}

/**
 * A row is kept for a given person only when the "Jours" cell parses AND at
 * least one metric cell is filled (zeros count). Template rows with only a
 * day number and empty / #DIV/0! metrics are ignored so charts match manual
 * entry (e.g. late-month placeholder rows in the sheet export).
 */
function parseDayBlock(row: string[], offset: number): DayMetrics | null {
  const day = parseNum(row[offset])
  if (day === null) return null
  const calls = parseNum(row[offset + 1])
  const open50 = parseNum(row[offset + 2])
  const openRate = parseNum(row[offset + 3])
  const rdv = parseNum(row[offset + 4])
  const convRate = parseNum(row[offset + 5])
  if (calls === null && open50 === null && openRate === null && rdv === null && convRate === null) {
    return null
  }
  return { day, calls, open50, openRate, rdv, convRate }
}

const METRIC_KEYS: MetricKey[] = ['calls', 'open50', 'openRate', 'rdv', 'convRate']

// Cells that live in col 23 of the source sheet but are NOT sales names —
// they're block/column headers that must be excluded from the data.
const SHOW_HEADER_LABELS = new Set(['nom du sales', "nb d'appel pour un show"])

/**
 * Scans every row for the optional "Nb d'appel pour un Show" side-table
 * (columns 23-26). Each entry is attached to a day row, so we simply collect
 * any row whose col 23 holds a non-numeric, non-empty name that isn't a header.
 */
function extractShowData(rows: string[][]): {
  showData: ShowRow[]
  showUpdatedAt: string | null
} {
  const showData: ShowRow[] = []
  let showUpdatedAt: string | null = null

  for (const row of rows) {
    const name = row[23]?.trim() ?? ''
    if (name === '' || SHOW_HEADER_LABELS.has(name.toLowerCase())) continue
    // A numeric value here means the column is being reused for day data on an
    // older sheet — ignore it.
    if (!isNaN(Number(name.replace(',', '.')))) continue

    const calls = parseNum(row[24])
    const shows = parseNum(row[25])
    // Safety net: if both numeric cells are empty, it's almost certainly a
    // stray header cell and not an actual sales entry.
    if (calls === null && shows === null) continue

    showData.push({ name, calls, shows })

    const date = row[26]?.trim() ?? ''
    if (date !== '' && showUpdatedAt === null) {
      showUpdatedAt = date
    }
  }

  return { showData, showUpdatedAt }
}

export function transformMonthSheet(title: string, rows: string[][]): MonthComparison {
  const sheetCal = parseSheetCalendarMonth(title)

  // Skip the 2 header rows, drop the Total row and any fully empty rows.
  const dataRows = rows.slice(2).filter((r) => {
    const first = r[0]?.trim() ?? ''
    return first !== '' && first.toLowerCase() !== 'total'
  })

  const parsed = dataRows
    .map((row) => ({
      Bilal: parseDayBlock(row, PERSON_OFFSETS.Bilal),
      Romain: parseDayBlock(row, PERSON_OFFSETS.Romain),
      Younes: parseDayBlock(row, PERSON_OFFSETS.Younes),
    }))
    .filter((p) => p.Bilal !== null || p.Romain !== null || p.Younes !== null)
    .filter((p) => {
      if (!sheetCal) return true
      const day = p.Bilal?.day ?? p.Romain?.day ?? p.Younes?.day ?? 0
      return !dayIsWeekendInSheetMonth(day, sheetCal.year, sheetCal.monthIndex)
    })

  const metrics = METRIC_KEYS.reduce((acc, key) => {
    acc[key] = parsed.map((blocks) => ({
      day: blocks.Bilal?.day ?? blocks.Romain?.day ?? blocks.Younes?.day ?? 0,
      Bilal: blocks.Bilal ? blocks.Bilal[key] : null,
      Romain: blocks.Romain ? blocks.Romain[key] : null,
      Younes: blocks.Younes ? blocks.Younes[key] : null,
    }))
    return acc
  }, {} as Record<MetricKey, ComparisonPoint[]>)

  // Show table may appear in any of the raw rows (header rows excluded, since
  // their col 23 is the literal "Nom du sales" title filtered out below).
  const { showData, showUpdatedAt } = extractShowData(rows)

  return { month: title, metrics, showData, showUpdatedAt }
}
