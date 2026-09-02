import 'server-only'
import dns from 'node:dns/promises'
import net from 'node:net'

const MAX_REDIRECTS = 3
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024
const ALLOWED_PORTS = new Set(['', '80', '443'])

function isPrivateIpv4(address: string) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true
  const [a, b] = parts
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  )
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase().split('%')[0]
  const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1]
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4)
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') || normalized.startsWith('fea') ||
    normalized.startsWith('feb') || normalized.startsWith('ff')
}

export function isPublicAddress(address: string) {
  const family = net.isIP(address)
  if (family === 4) return !isPrivateIpv4(address)
  if (family === 6) return !isPrivateIpv6(address)
  return false
}

export async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  const url = new URL(rawUrl)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Protocollo URL non consentito')
  if (!ALLOWED_PORTS.has(url.port)) throw new Error('Porta URL non consentita')
  if (url.username || url.password) throw new Error('Credenziali nell’URL non consentite')

  const records = await dns.lookup(url.hostname, { all: true, verbatim: true })
  if (!records.length || records.some((record) => !isPublicAddress(record.address))) {
    throw new Error('Destinazione di rete non consentita')
  }
  return url
}

async function readLimitedBody(response: Response): Promise<string> {
  const declared = Number(response.headers.get('content-length') ?? 0)
  if (declared > MAX_RESPONSE_BYTES) throw new Error('Risposta troppo grande')
  if (!response.body) return ''

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let total = 0
  let output = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new Error('Risposta troppo grande')
    }
    output += decoder.decode(value, { stream: true })
  }
  return output + decoder.decode()
}

export async function safeFetchText(rawUrl: string, accept: string): Promise<{ text: string; url: string }> {
  let current = await assertSafePublicUrl(rawUrl)

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(current, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'SignalFeed/1.0 (+https://github.com/ludovicoplatania-beep/signalfeed)',
        Accept: accept,
      },
      signal: AbortSignal.timeout(8_000),
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location || redirect === MAX_REDIRECTS) throw new Error('Redirect non valido')
      await response.body?.cancel()
      current = await assertSafePublicUrl(new URL(location, current).toString())
      continue
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return { text: await readLimitedBody(response), url: current.toString() }
  }

  throw new Error('Troppi redirect')
}
