import { useState, useCallback } from 'react'

// In dev: points to the Vite proxy path (/n8n/...) → avoids browser CORS restrictions.
// In production: should be the full https://... URL (set in .env.production).
const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string

// Basic auth header built once at module level (never changes)
const BASIC_AUTH = `Basic ${btoa('admin:parnassa')}`

export interface WebhookPayload {
  type: string
  user: string
  csv: string
}

interface WebhookState {
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  errorMessage: string | null
  responseData: unknown
}

export interface TriggerResult {
  ok: boolean
  data: unknown
}

interface UseN8nWebhookReturn extends WebhookState {
  trigger: (payload: WebhookPayload) => Promise<TriggerResult>
  reset: () => void
}

const initialState: WebhookState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  errorMessage: null,
  responseData: null,
}

/**
 * Sends form data as JSON to the CleanSmart webhook with Basic Auth.
 * Returns { ok, data } so the caller can react synchronously after await.
 * Also sets isError with the server's "message" field when status === "ko".
 */
export function useN8nWebhook(): UseN8nWebhookReturn {
  const [state, setState] = useState<WebhookState>(initialState)

  const trigger = useCallback(async (payload: WebhookPayload): Promise<TriggerResult> => {
    setState({ ...initialState, isLoading: true })

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: BASIC_AUTH,
        },
        body: JSON.stringify(payload),
      })

      const json = await response.json().catch(() => ({}))

      if (!response.ok || json?.status === 'ko') {
        const msg: string = json?.message ?? `Erreur serveur (${response.status})`
        setState({
          isLoading: false,
          isSuccess: false,
          isError: true,
          errorMessage: msg,
          responseData: null,
        })
        return { ok: false, data: null }
      }

      setState({
        isLoading: false,
        isSuccess: true,
        isError: false,
        errorMessage: null,
        responseData: json,
      })
      return { ok: true, data: json }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage: msg,
        responseData: null,
      })
      return { ok: false, data: null }
    }
  }, [])

  const reset = useCallback(() => setState(initialState), [])

  return { ...state, trigger, reset }
}
