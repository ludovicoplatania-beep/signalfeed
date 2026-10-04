// USD per million text tokens, verified 2026-10-04 against the OpenAI model page.
export const rateVersion = 'gpt-4o-mini:2026-10-04'
export function tokenCost(input: number, output: number, cached = 0) {
  return Math.ceil((Math.max(0, input - cached) * 0.15) + (Math.max(0, Math.min(input, cached)) * 0.075) + (Math.max(0, output) * 0.60))
}
export function reservationCost(request: { model: string; messages: unknown; max_completion_tokens?: number | null; max_tokens?: number | null }) {
  if (!['gpt-4o-mini', 'gpt-4o-mini-2024-07-18'].includes(request.model)) throw new Error('Modello senza tariffa verificata')
  // Every UTF-8 byte is a conservative text-token allowance, plus chat framing.
  const input = Buffer.byteLength(JSON.stringify(request), 'utf8') + 4096
  return tokenCost(input, request.max_completion_tokens ?? request.max_tokens ?? 16384)
}
