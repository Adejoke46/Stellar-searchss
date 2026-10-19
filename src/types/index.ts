export type { WalletState, StellarTransaction } from '../hooks/useFreighterWallet'
export type { SearchResult, SearchSession } from '../hooks/useSearch'

export interface ApiStat {
  totalQueries: number
  totalUsdcSettled: string
  avgLatencyMs: number
  uptime: string
}

// Shared contract for `GET /health` (see server/index.ts and server/health.test.ts).
export interface HealthResponse {
  status: 'ok'
  version: string
  network: string
  pricePerQuery: string
  protocol: 'x402'
  facilitator: string
  totalQueries: number
  totalUsdcSettled: string | number
  /** Mean upstream Serper request latency, when the server exposes it. */
  avgLatencyMs: number | null
  /** Runtime initialization-to-first-handler-entry measurement for this instance. */
  coldStartLatencyMs?: number | null
  /** Handler execution duration on a warm instance. */
  warmHandlerLatencyMs?: number | null
  invocationType?: 'cold' | 'warm' | null
  cacheHitRate: string
  uptime: string
  serperApiConfigured: boolean
  groqApiConfigured: boolean
  receivingAddressConfigured: boolean
}

export class HealthResponseValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HealthResponseValidationError'
  }
}

export function parseHealthResponse(data: any): HealthResponse {
  if (!data || typeof data !== 'object') {
    throw new HealthResponseValidationError('Invalid health response format')
  }
  const latency = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null

  return {
    status: data.status ?? 'ok',
    version: typeof data.version === 'string' ? data.version : 'unknown',
    network: typeof data.network === 'string' ? data.network : 'unknown',
    pricePerQuery: typeof data.pricePerQuery === 'string' ? data.pricePerQuery : 'unknown',
    protocol: data.protocol ?? 'x402',
    facilitator: typeof data.facilitator === 'string' ? data.facilitator : '',
    totalQueries: data.totalQueries ?? 0,
    totalUsdcSettled: data.totalUsdcSettled ?? '0.000',
    avgLatencyMs: latency(data.avgLatencyMs),
    coldStartLatencyMs: latency(data.coldStartLatencyMs),
    warmHandlerLatencyMs: latency(data.warmHandlerLatencyMs),
    invocationType: data.invocationType === 'cold' || data.invocationType === 'warm'
      ? data.invocationType
      : null,
    cacheHitRate: typeof data.cacheHitRate === 'string' ? data.cacheHitRate : '0.00',
    uptime: data.uptime ?? '100%',
    serperApiConfigured: Boolean(data.serperApiConfigured),
    groqApiConfigured: Boolean(data.groqApiConfigured),
    receivingAddressConfigured: Boolean(data.receivingAddressConfigured),
  }
}
