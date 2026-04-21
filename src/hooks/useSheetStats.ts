import { useState, useEffect, useRef, useCallback } from 'react'

type AgencyType = 'Mandataire' | 'Agence'
type AgentName = 'Bilal' | 'Younes'

export interface SheetStats {
  total: number | null
  treated: number | null
  ok: number | null
  /** Percentage of treated leads out of total leads (0–100), null when not computable */
  pct: number | null
  loading: boolean
  error: string | null
  /** Timestamp of the last successful fetch */
  lastUpdatedAt: number | null
}

/**
 * Returns the starting column index (0-based) in the full A2:L2 CSV row
 * for the given (agencyType, agent) combination.
 *
 * Column layout:
 *   A(0) B(1) C(2)  → Agence · Younes
 *   D(3) E(4) F(5)  → Agence · Bilal
 *   G(6) H(7) I(8)  → Mandataire · Bilal
 *   J(9) K(10) L(11) → Mandataire · Younes
 */
function getColOffset(agencyType: AgencyType, agent: AgentName): number {
  if (agencyType === 'Agence' && agent === 'Younes') return 0
  if (agencyType === 'Agence' && agent === 'Bilal') return 3
  if (agencyType === 'Mandataire' && agent === 'Bilal') return 6
  // Mandataire · Younes
  return 9
}

function toNum(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === '') return null
  const n = Number(raw.replace(',', '.'))
  return isNaN(n) ? null : n
}

/**
 * Parses a single CSV line, respecting quoted fields (e.g. "1,234").
 * Returns an array of raw string values.
 */
function parseCsvRow(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

const SHEET_ID = '1PzavmhTB69CT-13a89gYLSp7oo5zNdGRG2b7cE-asF4'
const POLL_INTERVAL_MS = 5_000

/**
 * Fetches the full row A2:L2 via the public CSV export URL (no API key needed
 * since the sheet is accessible to anyone with the link), then extracts the
 * 3 values for the current (agencyType, agent) selection.
 *
 * Polling is paused automatically when the browser tab is hidden, and can be
 * paused explicitly via the `enabled` flag (e.g. once the workflow is stopped).
 */
export function useSheetStats(
  agencyType: AgencyType,
  agent: AgentName,
  enabled: boolean = true,
): SheetStats {
  const [stats, setStats] = useState<SheetStats>({
    total: null,
    treated: null,
    ok: null,
    pct: null,
    loading: true,
    error: null,
    lastUpdatedAt: null,
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)

  const fetchStats = useCallback(async () => {
    // Export the full row 2 (columns A–L) as CSV — works on any public sheet
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&range=A2:L2`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Export CSV ${res.status}: ${res.statusText}`)
      }
      const text = await res.text()
      // The export returns a single data row (row 2); take the first non-empty line
      const line = text.split(/\r?\n/).find((l) => l.trim() !== '') ?? ''
      const row = parseCsvRow(line)

      const offset = getColOffset(agencyType, agent)
      const total = toNum(row[offset])
      const treated = toNum(row[offset + 1])
      const ok = toNum(row[offset + 2])
      const pct =
        total !== null && total > 0 && treated !== null
          ? Math.round((treated / total) * 100)
          : null

      if (isMountedRef.current) {
        setStats({ total, treated, ok, pct, loading: false, error: null, lastUpdatedAt: Date.now() })
      }
    } catch (err) {
      if (isMountedRef.current) {
        setStats((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        }))
      }
    }
  }, [agencyType, agent])

  useEffect(() => {
    isMountedRef.current = true

    const startPolling = () => {
      fetchStats()
      intervalRef.current = setInterval(fetchStats, POLL_INTERVAL_MS)
    }

    const stopPolling = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // When disabled (e.g. workflow stopped), freeze the current stats and skip polling
    if (!enabled) {
      return () => {
        isMountedRef.current = false
        stopPolling()
      }
    }

    // Reset to loading state whenever the selection changes (only when enabled,
    // so we don't blank out frozen stats when pausing after a stop).
    setStats({ total: null, treated: null, ok: null, pct: null, loading: true, error: null, lastUpdatedAt: null })

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    if (!document.hidden) {
      startPolling()
    }

    return () => {
      isMountedRef.current = false
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchStats, enabled])

  return stats
}
