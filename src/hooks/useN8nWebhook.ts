import { useState, useCallback } from 'react'

interface WebhookState {
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  errorMessage: string | null
}

interface UseN8nWebhookReturn extends WebhookState {
  trigger: (data: Record<string, unknown>) => Promise<void>
  reset: () => void
}

const initialState: WebhookState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  errorMessage: null,
}

/**
 * Sends form data as a POST JSON payload to the n8n webhook URL
 * configured via the VITE_N8N_WEBHOOK_URL environment variable.
 */
export function useN8nWebhook(): UseN8nWebhookReturn {
  const [state, setState] = useState<WebhookState>(initialState)

  const trigger = useCallback(async (data: Record<string, unknown>) => {
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined

    if (!webhookUrl) {
      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage: 'VITE_N8N_WEBHOOK_URL is not defined. Check your .env file.',
      })
      return
    }

    setState({ isLoading: true, isSuccess: false, isError: false, errorMessage: null })

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }

      setState({ isLoading: false, isSuccess: true, isError: false, errorMessage: null })
    } catch (err) {
      setState({
        isLoading: false,
        isSuccess: false,
        isError: true,
        errorMessage: err instanceof Error ? err.message : 'An unknown error occurred.',
      })
    }
  }, [])

  const reset = useCallback(() => setState(initialState), [])

  return { ...state, trigger, reset }
}
