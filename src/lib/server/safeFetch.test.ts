import { describe, expect, it, vi } from 'vitest'
import dns from 'node:dns/promises'
vi.mock('node:dns/promises', () => ({ default: { lookup: vi.fn() } }))
import { isPublicAddress, assertSafePublicUrl } from './safeFetch'

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
