import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@/lib/server/clients', () => ({ getOpenAI: () => ({ chat: { completions: { create: mocks.create } } }) }))
import { AICompletionError, createAICompletion } from './completion'
const params = { model: 'gpt-4o-mini', messages: [{ role: 'user' as const, content: 'JSON' }], max_completion_tokens: 2_000 }
const valid = { choices: [{ finish_reason: 'stop', message: { content: '{"picks":[]}' } }] }
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks() })
afterEach(() => vi.useRealTimers())
describe('bounded IA requests', () => {
  it('retries a timeout once and records recovery', async () => {
    mocks.create.mockRejectedValueOnce({ name: 'APIConnectionTimeoutError', message: 'Request timed out.' }).mockResolvedValueOnce(valid)
    const call = createAICompletion(params, { stage: 'picks', budgetMs: 65_000 })
    await vi.runAllTimersAsync()
    expect((await call).attempts).toBe(2)
    expect(mocks.create.mock.calls[0][1]).toMatchObject({ timeout: 40_000, maxRetries: 0 })
  })
  it('caps the second attempt at the remaining stage time', async () => {
    mocks.create.mockImplementationOnce(async () => { vi.setSystemTime(Date.now() + 40_000); throw { status: 503 } }).mockResolvedValueOnce(valid)
    const call = createAICompletion(params, { stage: 'picks', budgetMs: 65_000 })
    await vi.runAllTimersAsync(); await call
    expect(mocks.create.mock.calls[1][1].timeout).toBe(24_500)
  })
  it.each([{ status: 401 }, { status: 403 }, { status: 429, code: 'insufficient_quota' }, { status: 400 }])('does not repeat a permanent error %j', async error => {
    mocks.create.mockRejectedValue(error)
    await expect(createAICompletion(params, { stage: 'picks' })).rejects.toBeInstanceOf(AICompletionError)
    expect(mocks.create).toHaveBeenCalledTimes(1)
  })
  it('does not retry when insufficient time remains', async () => {
    mocks.create.mockImplementation(async () => { vi.setSystemTime(Date.now() + 39_000); throw { status: 503 } })
    await expect(createAICompletion(params, { stage: 'picks', budgetMs: 45_000 })).rejects.toMatchObject({ code: 'provider', attempts: 1 })
  })
  it('never exceeds two attempts on a temporary rate limit', async () => {
    mocks.create.mockRejectedValue({ status: 429 })
    const call = createAICompletion(params, { stage: 'picks' }).catch(error => error)
    await vi.runAllTimersAsync()
    expect(await call).toMatchObject({ code: 'rate_limit', attempts: 2 })
    expect(mocks.create).toHaveBeenCalledTimes(2)
  })
  it('retries truncated output with a larger output allowance', async () => {
    mocks.create.mockResolvedValueOnce({ choices: [{ finish_reason: 'length', message: { content: '{"picks":[' } }] }).mockResolvedValueOnce(valid)
    const call = createAICompletion(params, { stage: 'picks' })
    await vi.runAllTimersAsync(); await call
    expect(mocks.create.mock.calls[1][0].max_completion_tokens).toBe(3_000)
  })
  it('does not retry a refusal', async () => {
    mocks.create.mockResolvedValue({ choices: [{ finish_reason: 'stop', message: { content: null, refusal: 'Refused' } }] })
    await expect(createAICompletion(params, { stage: 'picks' })).rejects.toMatchObject({ code: 'refusal' })
    expect(mocks.create).toHaveBeenCalledTimes(1)
  })
})
