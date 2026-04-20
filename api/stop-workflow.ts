import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * POST /api/stop-workflow
 * Body: { executionId: string }
 *
 * Proxy that stops a running N8N execution via the N8N REST API.
 * The API key is kept server-side and never exposed to the client.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // @vercel/node auto-parses JSON bodies, but guard against edge cases
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const executionId = body?.executionId

  if (!executionId) {
    return res.status(400).json({ error: 'executionId manquant. Vérifiez que le webhook N8N retourne bien un executionId.' })
  }

  const baseUrl = process.env.N8N_BASE_URL
  const apiKey = process.env.N8N_API_KEY

  if (!baseUrl || !apiKey) {
    return res.status(500).json({ error: 'Variables N8N_BASE_URL ou N8N_API_KEY manquantes côté serveur.' })
  }

  const stopUrl = `${baseUrl}/api/v1/executions/${executionId}/stop`

  try {
    const n8nRes = await fetch(stopUrl, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    })

    const responseText = await n8nRes.text()

    if (!n8nRes.ok) {
      return res.status(n8nRes.status).json({
        error: `N8N API ${n8nRes.status} sur ${stopUrl}: ${responseText || n8nRes.statusText}`,
      })
    }

    const data = responseText ? JSON.parse(responseText) : {}
    return res.status(200).json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return res.status(500).json({ error: message })
  }
}
