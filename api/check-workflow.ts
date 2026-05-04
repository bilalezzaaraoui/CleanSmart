import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * GET /api/check-workflow?executionId=xxx
 *
 * Proxy that checks whether an N8N execution is still running.
 * Returns { active: boolean, finished?: boolean, stoppedAt?: string|null }.
 *
 * The API key is kept server-side and never exposed to the client.
 * A 404 from N8N (execution unknown / already purged) is treated as "not active"
 * so the client can safely redirect home.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const executionId = req.query.executionId
  if (!executionId || typeof executionId !== 'string') {
    return res.status(400).json({ error: 'executionId manquant' })
  }

  const baseUrl = process.env.N8N_BASE_URL
  const apiKey = process.env.N8N_API_KEY

  if (!baseUrl || !apiKey) {
    return res.status(500).json({ error: 'Variables N8N_BASE_URL ou N8N_API_KEY manquantes côté serveur.' })
  }

  const checkUrl = `${baseUrl}/api/v1/executions/${executionId}`

  try {
    const n8nRes = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    })

    // Execution unknown or already purged — treat as inactive so the UI can reset.
    if (n8nRes.status === 404) {
      return res.status(200).json({ active: false, finished: true, stoppedAt: null })
    }

    const responseText = await n8nRes.text()

    if (!n8nRes.ok) {
      return res.status(n8nRes.status).json({
        error: `N8N API ${n8nRes.status} sur ${checkUrl}: ${responseText || n8nRes.statusText}`,
      })
    }

    const data = responseText ? JSON.parse(responseText) : {}
    // N8N marks an execution as finished when it completes (success or error) or
    // as stoppedAt when it was stopped manually. In both cases, it's no longer active.
    const active = !data?.finished && !data?.stoppedAt
    return res.status(200).json({
      active,
      finished: Boolean(data?.finished),
      stoppedAt: data?.stoppedAt ?? null,
      status: data?.status ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return res.status(500).json({ error: message })
  }
}
