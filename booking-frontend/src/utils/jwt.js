/**
 * Decode JWT payload (middle segment) without verification.
 * Returns null if the token is malformed or not valid JSON.
 */
export function decodeJwtPayload(token) {
  try {
    if (typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length < 2) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )

    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * True if token cannot be decoded, or exp is in the past.
 * Missing `exp` is treated as not expired (JWT without expiry).
 */
export function isJwtExpired(token) {
  const payload = decodeJwtPayload(token)
  if (!payload) return true
  if (payload.exp == null) return false
  const expMs = Number(payload.exp) * 1000
  return !Number.isFinite(expMs) || expMs <= Date.now()
}
