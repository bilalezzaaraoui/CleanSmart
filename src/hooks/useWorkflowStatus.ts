import { useEffect, useRef, useState } from 'react'

const POLL_INTERVAL_MS = 5_000
const POLL_SECONDS = POLL_INTERVAL_MS / 1_000

interface UseWorkflowStatusResult {
  /** null while the first check hasn't completed, then boolean. */
  isActive: boolean | null
  /** n8n status string ('success' | 'error' | 'crashed' | 'waiting' | null). */
  finishedStatus: string | null
  /** Seconds remaining until the next status check (from POLL_SECONDS down to 0). */
  secondsUntilNextCheck: number
}

/**
 * Polls the n8n execution status every 5 s via /api/check-workflow.
 * Also exposes a tiny countdown (5 → 0) so the UI can show it next to the poller.
 *
 * - `enabled` lets the caller start/stop polling (e.g. only after the initial
 *   10s countdown, and stop once the workflow has been manually stopped).
 * - Errors are swallowed: we keep the previous `isActive` value on failure so
 *   a transient network blip doesn't redirect the user home.
 */
export function useWorkflowStatus(
  executionId: string | null,
  enabled: boolean,
): UseWorkflowStatusResult {
  const [isActive, setIsActive] = useState<boolean | null>(null)
  const [finishedStatus, setFinishedStatus] = useState<string | null>(null)
  const [secondsUntilNextCheck, setSecondsUntilNextCheck] = useState(POLL_SECONDS)
  const lastCheckRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!executionId || !enabled) {
      setIsActive(null)
      setFinishedStatus(null)
      setSecondsUntilNextCheck(POLL_SECONDS)
      return
    }

    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch(`/api/check-workflow?executionId=${encodeURIComponent(executionId)}`)
        if (cancelled) return
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (cancelled || !data) return
        setIsActive(Boolean(data.active))
        if (!data.active && data.status) setFinishedStatus(data.status)
      } catch {
        // Keep previous state on transient error; avoid spurious redirects.
      } finally {
        lastCheckRef.current = Date.now()
      }
    }

    check()
    const pollId = setInterval(check, POLL_INTERVAL_MS)

    const tickId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastCheckRef.current) / 1_000)
      setSecondsUntilNextCheck(Math.max(0, POLL_SECONDS - elapsed))
    }, 1_000)

    return () => {
      cancelled = true
      clearInterval(pollId)
      clearInterval(tickId)
    }
  }, [executionId, enabled])

  return { isActive, finishedStatus, secondsUntilNextCheck }
}
