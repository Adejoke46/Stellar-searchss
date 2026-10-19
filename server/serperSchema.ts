/**
 * serperSchema — shape-drift warnings for Serper.dev responses.
 *
 * Serper occasionally renames or drops fields. The response is still usable
 * (mapping helpers fall back to empty values), but every missing field is
 * logged so drift is visible in server logs before users report it.
 */

function warnFields(label: string, data: unknown, fields: string[]): void {
  if (data === null || typeof data !== 'object') {
    console.warn(`[serper] ${label}: expected an object, got ${data === undefined ? 'undefined' : typeof data}`)
    return
  }
  const record = data as Record<string, unknown>
  const missing = fields.filter((field) => record[field] === undefined)
  if (missing.length > 0) {
    console.warn(`[serper] ${label}: missing field(s) ${missing.join(', ')}`)
  }
}

/**
 * Warn when `fields` are absent from `data`. If `data` is an array, each
 * element is checked and warnings are prefixed with its index.
 */
export function warnOnMissingFields(label: string, data: unknown, fields: string[]): void {
  if (Array.isArray(data)) {
    if (data.length === 0) {
      console.warn(`[serper] ${label}: array is empty`)
      return
    }
    data.forEach((item, index) => warnFields(`${label}[${index}]`, item, fields))
    return
  }
  warnFields(label, data, fields)
}
