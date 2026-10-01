import { describe, expect, it, vi } from 'vitest'
import dns from 'node:dns/promises'
vi.mock('node:dns/promises', () => ({ default: { lookup: vi.fn() } }))
import { isPublicAddress, assertSafePublicUrl, decodePublisherText } from './safeFetch'

describe('SSRF address filtering', () => {
  it.each([
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '::1',
    'fd00::1',
    '::ffff:169.254.169.254',
  ])(
    'blocks private address %s',
    (address) => expect(isPublicAddress(address)).toBe(false),
  )

  it.each(['1.1.1.1', '8.8.8.8', '2606:4700:4700::1111'])(
    'allows public address %s',
    (address) => expect(isPublicAddress(address)).toBe(true),
  )
})


describe('temporary DNS errors', () => {
  it('retries a transient lookup once', async () => {
    vi.mocked(dns.lookup).mockRejectedValueOnce(Object.assign(new Error('busy'), { code: 'EBUSY' })).mockResolvedValueOnce([{ address: '8.8.8.8', family: 4 }] as never)
    expect((await assertSafePublicUrl('https://example.com/feed')).hostname).toBe('example.com')
  })
  it('still rejects private destinations after a retry', async () => {
    vi.mocked(dns.lookup).mockRejectedValueOnce(Object.assign(new Error('busy'), { code: 'EAI_AGAIN' })).mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }] as never)
    await expect(assertSafePublicUrl('https://example.com/feed')).rejects.toThrow('Destinazione di rete non consentita')
  })
})


describe('publisher encoding', () => {
  it('decodes declared Latin-1 XML accents', () => {
    const text = '<?xml version="1.0" encoding="ISO-8859-1"?><title>più qualità</title>'
    const bytes = Uint8Array.from(text, c => c.charCodeAt(0))
    expect(decodePublisherText(bytes, 'application/xml')).toBe(text)
  })
  it('preserves UTF-8 Italian text', () => {
    expect(decodePublisherText(new TextEncoder().encode('Più qualità — 200€'), null)).toBe('Più qualità — 200€')
  })
  it('uses the HTTP charset for legacy text', () => {
    expect(decodePublisherText(new Uint8Array([0xe8, 0x20, 0x80]), 'text/html; charset=windows-1252')).toBe('è €')
  })
})
