import { describe, expect, it } from 'vitest'
import { cassazionePageItems } from './discovery'
function card(id: string, date: string) { return `<div class="card-news"><div class="card-main"><h3><a href="/it/penale_dettaglio.page?contentId=${id}" title="Vai alla pagina">Sentenza n. 34754 ud. 09/09/2026 - deposito del 28/09/2026</a></h3><p>Giudizio di legittimità: giustizia riparativa</p></div><span class="visually-hidden">Giustizia riparativa del ${date}</span></div>` }
describe('official Cassazione publication cards', () => {
  it('uses publication rather than hearing/deposit dates and preserves distinct documents', () => {
    const items = cassazionePageItems(card('SZP52359', '30/09/26') + card('SZP52359', '30/09/26') + card('SZP52356', '30/09/2026'), 'https://www.cortedicassazione.it/it/giurisprudenza_penale.page')
    expect(items).toHaveLength(2)
    expect(items[0].pubDate).toBe('2026-09-30T00:00:00.000Z')
    expect(items[0].title).toContain('Sentenza n. 34754')
    expect(items[0].contentSnippet).toContain('riparativa')
  })
  it('does not invent missing dates or accept malformed calendar dates or off-site links', () => {
    const items = cassazionePageItems(card('SZP1', '31/02/26') + card('SZP2', '') + card('BAD', '30/09/26') + card('SZP3', '30/09/26').replace('/it/penale_dettaglio.page', 'https://evil.example/it/penale_dettaglio.page'), 'https://www.cortedicassazione.it/it/giurisprudenza_penale.page')
    expect(items).toHaveLength(2)
    expect(items.every(item => !item.pubDate)).toBe(true)
  })
})
