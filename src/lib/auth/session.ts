export const ACCESS_COOKIE = 'signalfeed_access'
const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60

function toBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function signature(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toBase64Url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))
}

export async function createAccessToken(secret: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
  return `${expiresAt}.${await signature(String(expiresAt), secret)}`
}

export async function verifyAccessToken(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return false
  const [expiresAtRaw, suppliedSignature, extra] = token.split('.')
  if (!expiresAtRaw || !suppliedSignature || extra) return false
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() / 1000) return false
  const expectedSignature = await signature(expiresAtRaw, secret)

  const supplied = new TextEncoder().encode(suppliedSignature)
  const expected = new TextEncoder().encode(expectedSignature)
  if (supplied.length !== expected.length) return false
  let difference = 0
  for (let index = 0; index < supplied.length; index += 1) {
    difference |= supplied[index] ^ expected[index]
  }
  return difference === 0
}
