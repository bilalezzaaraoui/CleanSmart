import { useEffect, useState } from 'react'

const SHEET_ID = '1bByPMVAREKXjOC2YOn0Al6DS36U4eqNYBQmGc6ibbCg'

// List all tab names here (exclude "Template"). Add new months as they appear.
const SHEET_NAMES = ['Mars 2026', 'Avril 2026']

export interface SheetData {
  title: string
  rows: string[][]
}

interface UseAllSheetsResult {
  sheets: SheetData[]
  loading: boolean
  error: string | null
}

/**
 * Full CSV parser that walks char-by-char to correctly handle:
 *   - quoted fields containing commas
 *   - multi-line quoted fields (newlines inside quotes)
 *   - escaped quotes ("") inside quoted fields
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      row.push(current)
      current = ''
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      // Treat \r\n as a single line break
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(current)
      current = ''
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
    } else {
      current += c
    }
  }
  // Flush any trailing content
  if (current !== '' || row.length > 0) {
    row.push(current)
    if (row.some((v) => v !== '')) rows.push(row)
  }
  return rows
}

// Fetches one tab as CSV via the public gviz endpoint (CORS-friendly, no API key).
async function fetchSheet(name: string): Promise<SheetData> {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
    `?tqx=out:csv&sheet=${encodeURIComponent(name)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${name}: ${res.status} ${res.statusText}`)
  const csv = await res.text()
  return { title: name, rows: parseCsv(csv) }
}

/**
 * Fetches all listed tabs in parallel from the public Google Sheet.
 * Template is excluded by omission from SHEET_NAMES.
 */
export function useAllSheets(): UseAllSheetsResult {
  const [state, setState] = useState<UseAllSheetsResult>({
    sheets: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const results = await Promise.all(SHEET_NAMES.map(fetchSheet))
        if (!cancelled) {
          setState({ sheets: results, loading: false, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            sheets: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Erreur inconnue',
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
