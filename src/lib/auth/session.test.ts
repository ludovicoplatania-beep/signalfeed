import { describe, expect, it } from 'vitest'
import { createAccessToken, verifyAccessToken } from './session'

const secret = 'test-session-secret-with-at-least-32-characters'

describe('single-user session', () => {
  it('accepts a freshly signed token', async () => {
    expect(await verifyAccessToken(await createAccessToken(secret), secret)).toBe(true)
  })

  it('rejects tampered and differently signed tokens', async () => {
    const token = await createAccessToken(secret)
    expect(await verifyAccessToken(`${token}x`, secret)).toBe(false)
    expect(await verifyAccessToken(token, `${secret}-different`)).toBe(false)
  })

  it('rejects missing tokens', async () => {
    expect(await verifyAccessToken(undefined, secret)).toBe(false)
  })
})
