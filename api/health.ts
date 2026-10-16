import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'node:crypto'
import { handlerElapsedMs, startInvocation } from './invocationMetrics'
import { EMPTY_HEALTH_STATS, handleHealth, sendResult } from '../server/handlers'
import { buildCorsHeaders } from '../server/corsConfig'

// GET /api/health — thin adapter over the shared health handler. The payload,
// ETag and Cache-Control match the Express /health route exactly; a serverless
// process has no live counters, so it reports a zeroed stats snapshot.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const invocation = startInvocation()
  for (const [name, value] of Object.entries(
    buildCorsHeaders(req.headers.origin as string | undefined),
  )) {
    res.setHeader(name, value)
  }

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const ifNoneMatch = req.headers['if-none-match']

  const result = handleHealth({
    ifNoneMatch: Array.isArray(ifNoneMatch) ? ifNoneMatch[0] : ifNoneMatch,
    stats: EMPTY_HEALTH_STATS,
  })

  if (result.body && typeof result.body === 'object') {
    const body = {
      ...result.body,
      invocationType: invocation.invocationType,
      coldStartLatencyMs: invocation.coldStartLatencyMs,
      warmHandlerLatencyMs:
        invocation.invocationType === 'warm' ? handlerElapsedMs(invocation) : null,
    }
    result.body = body
    result.headers.ETag = `W/"${createHash('sha1').update(JSON.stringify(body)).digest('hex')}"`
  }

  return sendResult(res, result)
}
