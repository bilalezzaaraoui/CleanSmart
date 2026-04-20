import React, { useEffect, useRef, useState } from 'react'
import { useSheetStats } from '../hooks/useSheetStats'

type AgencyType = 'Mandataire' | 'Agence'
type AgentName = 'Bilal' | 'Younes'

interface CleanSmartDataProps {
  agencyType: AgencyType
  agent: AgentName
  onReset: () => void
}

const COUNTDOWN_SECONDS = 10

/**
 * Full-screen countdown overlay with an SVG ring that empties over COUNTDOWN_SECONDS.
 * Calls onDone when it reaches zero.
 */
const CountdownScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS)
  // SVG ring geometry
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          // Defer so the state update (0) renders before switching view
          setTimeout(() => onDoneRef.current(), 50)
          return 0
        }
        return prev - 1
      })
    }, 1_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
        Workflow en cours…
      </p>

      {/* Ring */}
      <div className="relative flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
          {/* Background track */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Animated foreground ring */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="#1B7ED4"
            strokeWidth="8"
            strokeLinecap="round"
            className="countdown-ring-fill"
            style={{
              '--circumference': circumference,
              '--duration': `${COUNTDOWN_SECONDS}s`,
            } as React.CSSProperties}
          />
        </svg>

        {/* Number in the centre */}
        <span className="absolute text-3xl font-bold text-gray-800 tabular-nums">
          {remaining}
        </span>
      </div>

      <p className="text-[11px] text-gray-300 text-center">
        Les données seront disponibles dans {remaining} s
      </p>
    </div>
  )
}

/** Displays a single metric (number + label). Shows a skeleton while loading. */
const StatCard: React.FC<{ label: string; value: number | null; loading: boolean }> = ({
  label,
  value,
  loading,
}) => (
  <div className="flex flex-col items-center gap-1 flex-1">
    {loading ? (
      <div className="h-8 w-10 rounded-lg bg-gray-200 animate-pulse" />
    ) : (
      <span className="text-2xl font-bold text-gray-900 tabular-nums">
        {value !== null ? value : '—'}
      </span>
    )}
    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide text-center leading-tight">
      {label}
    </span>
  </div>
)

/** Wave-animated progress bar. The wave is a CSS animation defined in index.css. */
const WaveBar: React.FC<{ pct: number | null; loading: boolean }> = ({ pct, loading }) => {
  const filled = pct ?? 0

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">Taux Rdv OK / rdv traités</span>
        {loading ? (
          <div className="h-4 w-8 rounded bg-gray-200 animate-pulse" />
        ) : (
          <span className="text-xs font-bold text-[#1B7ED4]">
            {pct !== null ? `${pct} %` : '—'}
          </span>
        )}
      </div>

      {/* Track */}
      <div className="relative h-3 w-full rounded-full bg-gray-100 overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        ) : (
          <div
            className="h-full rounded-full wave-bar transition-all duration-700"
            style={{ width: `${filled}%` }}
          />
        )}
      </div>
    </div>
  )
}

/** Shows elapsed seconds since lastUpdatedAt, refreshing every second. */
const RefreshTimer: React.FC<{ lastUpdatedAt: number | null }> = ({ lastUpdatedAt }) => {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (lastUpdatedAt === null) return
    setElapsed(0)
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - lastUpdatedAt) / 1_000))
    }, 1_000)
    return () => clearInterval(id)
  }, [lastUpdatedAt])

  if (lastUpdatedAt === null) return null

  return (
    <p className="text-[11px] text-gray-400 text-center">
      Actualisé il y a {elapsed} s
    </p>
  )
}

/**
 * Displayed after a successful form submission.
 * Shows a 10-second countdown ring first, then reveals the live stats panel.
 * Polls Google Sheets every 5 s for lead metrics.
 * Blocks navigation while active (refresh, back, tab close).
 */
const CleanSmartData: React.FC<CleanSmartDataProps> = ({ agencyType, agent, onReset: _onReset }) => {
  const [countdownDone, setCountdownDone] = useState(false)
  const { total, treated, ok, pct, loading, error, lastUpdatedAt } = useSheetStats(agencyType, agent)

  // Prevent accidental navigation (refresh, back, tab close) while on this page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message = '⚠️ Arrête le workflow d\'abord'
      e.preventDefault()
      e.returnValue = message
      return message
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  if (!countdownDone) {
    return <CountdownScreen onDone={() => setCountdownDone(true)} />
  }

  return (
    <div className="flex flex-col gap-4 fade-in">

      {/* Header — icon and title side by side */}
      <div className="flex items-center gap-2.5">
        <span className="flex shrink-0 h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-lg">
          ✓
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-800">CSV reçu</p>
          <p className="text-[11px] text-gray-400 font-medium">
            {agencyType} · {agent}
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 text-center leading-relaxed">
          {error}
        </p>
      )}

      {/* Stat cards */}
      <div className="flex gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
        <StatCard label="Total" value={total} loading={loading} />

        <div className="w-px bg-gray-200 self-stretch" />

        <StatCard label="Traités" value={treated} loading={loading} />

        <div className="w-px bg-gray-200 self-stretch" />

        <StatCard label="OK" value={ok} loading={loading} />
      </div>

      {/* Wave progress bar */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <WaveBar pct={pct} loading={loading} />
      </div>

      {/* Refresh timestamp */}
      <RefreshTimer lastUpdatedAt={lastUpdatedAt} />
    </div>
  )
}

export default CleanSmartData
