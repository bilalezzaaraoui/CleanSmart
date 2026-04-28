import React, { useEffect, useRef, useState } from 'react'
import { useSheetStats } from '../hooks/useSheetStats'
import { useWorkflowStatus } from '../hooks/useWorkflowStatus'

type AgencyType = 'Mandataire' | 'Agence'
type AgentName = 'Bilal' | 'Younes'

interface CleanSmartDataProps {
  agencyType: AgencyType
  agent: AgentName
  executionId: string | null
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
const StatCard: React.FC<{ label: React.ReactNode; value: number | null; loading: boolean }> = ({
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
        <span className="text-xs font-semibold text-gray-500">Leads traités / total</span>
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

/** Counts down the seconds until the next poll (POLL_INTERVAL_MS resets on each lastUpdatedAt change). */
const RefreshTimer: React.FC<{ lastUpdatedAt: number | null }> = ({ lastUpdatedAt }) => {
  const POLL_SECONDS = 5
  const [remaining, setRemaining] = useState(POLL_SECONDS)

  useEffect(() => {
    if (lastUpdatedAt === null) return
    const tick = () => {
      const elapsed = Math.floor((Date.now() - lastUpdatedAt) / 1_000)
      setRemaining(Math.max(0, POLL_SECONDS - elapsed))
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [lastUpdatedAt])

  if (lastUpdatedAt === null) return null

  return (
    <p className="text-[11px] text-gray-500 text-center">
      Actualisation dans {remaining} s
    </p>
  )
}

/** Confirmation modal before stopping the workflow. */
const StopConfirmModal: React.FC<{
  executionId: string
  onConfirm: () => void
  onCancel: () => void
}> = ({ executionId, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    />

    {/* Dialog */}
    <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex shrink-0 h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-500 text-lg">
          ⚠️
        </span>
        <div>
          <p className="text-sm font-bold text-gray-900">Arrêter le workflow ?</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            L'exécution <span className="font-mono font-semibold text-gray-600">#{executionId}</span> sera stoppée immédiatement. Cette action est irréversible.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] cursor-pointer"
        >
          Oui, stopper
        </button>
      </div>
    </div>
  </div>
)

/**
 * Renders an emoji as a favicon by drawing it on a canvas and converting to data URL.
 * Uses getAttribute('href') (relative path) instead of .href (resolved URL) so the
 * restore reliably points back to the original asset.
 */
function setEmojiFavicon(emoji: string): () => void {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.font = '28px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, 16, 16)
  }
  const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
  // getAttribute returns the raw relative path (e.g. "/favicon.png"), not the resolved URL
  const originalHref = link?.getAttribute('href') ?? '/favicon.svg'
  const originalType = link?.getAttribute('type') ?? 'image/svg+xml'
  if (link) {
    link.setAttribute('href', canvas.toDataURL('image/png'))
    link.setAttribute('type', 'image/png')
  }
  return () => {
    if (link) {
      link.setAttribute('href', originalHref)
      link.setAttribute('type', originalType)
    }
  }
}

/**
 * Displayed after a successful form submission.
 * Shows a 10-second countdown ring first, then reveals the live stats panel.
 * Polls Google Sheets every 5 s for lead metrics.
 * Blocks navigation while active (refresh, back, tab close).
 */
const CleanSmartData: React.FC<CleanSmartDataProps> = ({ agencyType, agent, executionId, onReset }) => {
  const [countdownDone, setCountdownDone] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [stopError, setStopError] = useState<string | null>(null)
  const [stopped, setStopped] = useState(false)

  // Pause Google Sheets polling once the workflow is stopped to avoid useless
  // fetches and to freeze the "Actualisation dans X s" label.
  const sheetsEnabled = !stopped && !isStopping
  const { total, treated, ok, pct, loading, error, lastUpdatedAt } = useSheetStats(
    agencyType,
    agent,
    sheetsEnabled,
  )

  // Poll n8n every 5s to check if the workflow is still running. We only start
  // polling after the initial 10s countdown and stop as soon as the workflow
  // has been (or is being) stopped manually — avoids a redundant redirect.
  const pollingEnabled = countdownDone && !stopped && !isStopping
  const { isActive, secondsUntilNextCheck } = useWorkflowStatus(executionId, pollingEnabled)

  // Auto-redirect home when n8n confirms the execution is no longer active.
  // Strict `=== false` avoids firing on the initial `null` state.
  useEffect(() => {
    if (isActive === false && !stopped && !isStopping) {
      setStopped(true)
      const id = setTimeout(onReset, 1_500)
      return () => clearTimeout(id)
    }
  }, [isActive, stopped, isStopping, onReset])

  // Swap favicon to 🔄 while the workflow is running
  const restoreFaviconRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    const restore = setEmojiFavicon('🔄')
    restoreFaviconRef.current = restore
    return restore
  }, [])

  // Restore favicon immediately when the workflow is stopped (before the unmount delay)
  useEffect(() => {
    if (stopped) restoreFaviconRef.current?.()
  }, [stopped])

  // Warn the user before leaving so they know the workflow will be auto-stopped
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message = '⚠️ Le workflow sera arrêté automatiquement si vous quittez.'
      e.preventDefault()
      e.returnValue = message
      return message
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  /**
   * When the page is actually being unloaded (after the user confirms leaving),
   * send a stop request via sendBeacon. Unlike fetch, sendBeacon is guaranteed
   * to complete even after the page closes — it's the only reliable way to fire
   * a network request on tab/browser close.
   * We skip this if the workflow was already stopped manually.
   */
  useEffect(() => {
    const handlePageHide = () => {
      if (!executionId || stopped) return
      const blob = new Blob(
        [JSON.stringify({ executionId })],
        { type: 'application/json' },
      )
      navigator.sendBeacon('/api/stop-workflow', blob)
      sessionStorage.removeItem('cleansmart_executionId')
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [executionId, stopped])

  const confirmStop = async () => {
    setShowConfirm(false)
    if (!executionId || isStopping || stopped) return
    setIsStopping(true)
    setStopError(null)
    try {
      const res = await fetch('/api/stop-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error ?? `Erreur ${res.status}`)
      }
      setStopped(true)
      // Redirect to the form after a short pause so the user sees the "stopped" state
      setTimeout(onReset, 1_500)
    } catch (err) {
      setStopError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsStopping(false)
    }
  }

  if (!countdownDone) {
    return <CountdownScreen onDone={() => setCountdownDone(true)} />
  }

  return (
    <>
      {/* Confirmation modal — rendered outside the card flow */}
      {showConfirm && executionId && (
        <StopConfirmModal
          executionId={executionId}
          onConfirm={confirmStop}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Tiny top-right poll countdown — parent card is `relative` (see App.tsx) */}
      {pollingEnabled && executionId && (
        <span
          className="absolute top-2 right-3 text-[10px] font-medium text-gray-400 tabular-nums pointer-events-none"
          aria-hidden="true"
        >
          {secondsUntilNextCheck}s
        </span>
      )}

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

          {/* OK rate badge: leads OK / leads traités */}
          <div className="ml-auto">
            {loading ? (
              <div className="h-6 w-14 rounded-full bg-gray-200 animate-pulse" />
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-600">
                {treated !== null && treated > 0 && ok !== null
                  ? `${Math.round((ok / treated) * 100)} %`
                  : '—'}
              </span>
            )}
          </div>
        </div>

        {/* Error banner (Sheets) */}
        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 text-center leading-relaxed">
            {error}
          </p>
        )}

        {/* Stat cards */}
        <div className="flex gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
          <StatCard label={<>Leads<br />total</>} value={total} loading={loading} />

          <div className="w-px bg-gray-200 self-stretch" />

          <StatCard label={<>Leads<br />traités</>} value={treated} loading={loading} />

          <div className="w-px bg-gray-200 self-stretch" />

          <StatCard label={<>Leads<br />OK</>} value={ok} loading={loading} />
        </div>

        {/* Wave progress bar */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <WaveBar pct={pct} loading={loading} />
        </div>

        {/* Refresh timestamp — hidden once polling is paused (workflow stopped) */}
        {sheetsEnabled && <RefreshTimer lastUpdatedAt={lastUpdatedAt} />}

        {/* Stop workflow button */}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isStopping || stopped || !executionId}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]
              ${stopped
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isStopping
                  ? 'bg-red-300 text-white cursor-not-allowed'
                  : !executionId
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white cursor-pointer'
              }`}
          >
            {stopped
              ? '■ Workflow arrêté'
              : isStopping
                ? 'Arrêt en cours…'
                : '■ Stop le workflow'}
          </button>

          {/* No executionId warning */}
          {!executionId && !stopped && (
            <p className="text-[11px] text-gray-300 text-center">
              Pas d'executionId — vérifie la config du webhook N8N
            </p>
          )}

          {/* Stop error */}
          {stopError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 text-center leading-relaxed">
              {stopError}
            </p>
          )}
        </div>
      </div>
    </>
  )
}

export default CleanSmartData
