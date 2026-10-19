/**
 * serper — mapping helpers for Serper.dev search/images/news responses.
 *
 * Mapping is deliberately forgiving: a renamed or dropped upstream field maps
 * to an empty default and emits a console warning instead of throwing, so a
 * schema change never takes a paid query down. `validateSerperResponse`
 * returns the same findings as strings for tests and diagnostics.
 */

type Rec = Record<string, unknown>

export interface OrganicResult {
  title: string
  link: string
  snippet: string
}

export interface ImageResult {
  title: string
  imageUrl: string
  imageWidth: number
  imageHeight: number
}

export interface NewsResult {
  title: string
  link: string
  snippet: string
  source: string
  date: string
}

const REQUIRED_FIELDS = {
  organic: ['title', 'link', 'snippet'],
  images: ['title', 'imageUrl', 'imageWidth', 'imageHeight'],
  news: ['title', 'link', 'snippet', 'source', 'date'],
} as const

export type SerperKind = keyof typeof REQUIRED_FIELDS

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback
}

function item(raw: unknown): Rec {
  return (raw !== null && typeof raw === 'object' ? raw : {}) as Rec
}

function warnMissing(kind: SerperKind, index: number, source: Rec): void {
  const missing = REQUIRED_FIELDS[kind].filter((field) => source[field] === undefined)
  if (missing.length > 0) {
    console.warn(`[serper] ${kind}[${index}]: missing field(s) ${missing.join(', ')}`)
  }
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function mapOrganicResults(items: unknown): OrganicResult[] {
  return toArray(items).map((raw, index) => {
    const source = item(raw)
    warnMissing('organic', index, source)
    return {
      title: asString(source.title),
      link: asString(source.link),
      snippet: asString(source.snippet),
    }
  })
}

export function mapImageResults(items: unknown): ImageResult[] {
  return toArray(items).map((raw, index) => {
    const source = item(raw)
    warnMissing('images', index, source)
    return {
      title: asString(source.title),
      imageUrl: asString(source.imageUrl),
      imageWidth: asNumber(source.imageWidth),
      imageHeight: asNumber(source.imageHeight),
    }
  })
}

export function mapNewsResults(items: unknown): NewsResult[] {
  return toArray(items).map((raw, index) => {
    const source = item(raw)
    warnMissing('news', index, source)
    return {
      title: asString(source.title),
      link: asString(source.link),
      snippet: asString(source.snippet),
      source: asString(source.source),
      date: asString(source.date),
    }
  })
}

/**
 * Validate a full Serper response body against the expected contract for
 * `kind`. Returns one warning string per missing field (empty when valid).
 */
export function validateSerperResponse(fixture: unknown, kind: SerperKind): string[] {
  const body = item(fixture)
  const entries = toArray(body[kind])
  if (entries.length === 0) {
    return [`${kind}: expected a non-empty array`]
  }
  const warnings: string[] = []
  entries.forEach((raw, index) => {
    const source = item(raw)
    for (const field of REQUIRED_FIELDS[kind]) {
      if (source[field] === undefined) {
        warnings.push(`${kind}[${index}]: missing ${field}`)
      }
    }
  })
  return warnings
}
