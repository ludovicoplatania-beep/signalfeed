import { canonicalArticleUrl } from '@/lib/articles/identity'

export const benchmarkId = '2026-10-02-v1'
export const benchmarkCutoff = '2026-10-02T18:00:00.000Z'
export const sectors = ['IA', 'Tecnologia', 'Gaming', 'Locale', 'Diritto'] as const
export type CoverageEvent = { id: string; sector: typeof sectors[number]; title: string; date: string; reference: string; anchors: string[][] }
// Freeze the sample before measuring Athena. Never replace a missing event to improve the score.
export const benchmarkEvents: CoverageEvent[] = [
  { id: 'gemini-argon', sector: 'IA', title: 'Google presenta Gemini 4 Argon', date: '2026-09-30', reference: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/', anchors: [['gemini'], ['argon']] },
  { id: 'gpt-sol', sector: 'IA', title: 'OpenAI presenta GPT 6.1 Sol', date: '2026-09-29', reference: 'https://deploymentsafety.openai.com/gpt-6-1-sol', anchors: [['gpt-6.1', 'gpt 6.1'], ['sol']] },
  { id: 'sonnet', sector: 'IA', title: 'Anthropic presenta Claude Sonnet 5.5', date: '2026-09-28', reference: 'https://www.anthropic.com/claude-sonnet-5-5', anchors: [['sonnet'], ['5.5']] },
  { id: 'coreweave', sector: 'IA', title: 'CoreWeave e NVIDIA: agenti e Vera Rubin', date: '2026-09-30', reference: 'https://blogs.nvidia.com/blog/coreweave-agentic-ai-vera-rubin/', anchors: [['coreweave'], ['vera', 'rubin', 'forge']] },
  { id: 'final-cut', sector: 'Tecnologia', title: 'Final Cut Camera supporta l’apertura variabile', date: '2026-09-29', reference: 'https://www.apple.com/newsroom/2026/09/final-cut-camera-now-supports-variable-aperture-on-iphone-18-pro/', anchors: [['final cut camera'], ['aperture', 'apertura', '2.4']] },
  { id: 'probatio', sector: 'Tecnologia', title: 'Home Assistant introduce Probatio', date: '2026-09-30', reference: 'https://developers.home-assistant.io/blog/2026/09/30/probatio-validation-engine', anchors: [['probatio'], ['validation', 'validazione', 'home assistant']] },
  { id: 'dell-csm', sector: 'Tecnologia', title: 'Vulnerabilità critiche in Dell CSM', date: '2026-10-02', reference: 'https://www.bleepingcomputer.com/news/security/new-max-severity-dell-csm-flaws-give-hackers-admin-privileges/', anchors: [['dell'], ['csm', 'container storage']] },
  { id: 'fortimail', sector: 'Tecnologia', title: 'FortiMail: attacchi tramite vulnerabilità zero-day', date: '2026-10-01', reference: 'https://www.bleepingcomputer.com/news/security/fortinet-warns-of-critical-fortimail-flaw-exploited-in-zero-day-attacks/', anchors: [['fortimail'], ['104286', 'zero-day', 'zero day']] },
  { id: 'qssr', sector: 'Gaming', title: 'PlayStation annuncia QSSR per PS5', date: '2026-10-01', reference: 'https://blog.playstation.com/2026/10/01/ai-upscaling-is-coming-to-ps5/', anchors: [['qssr'], ['ps5', 'playstation']] },
  { id: 'kena', sector: 'Gaming', title: 'Kena: Scars of Kosmora arriva nel 2027', date: '2026-10-01', reference: 'https://blog.playstation.com/2026/10/01/kena-scars-of-kosmora-launches-2027-ember-lab-shares-story-overview/', anchors: [['kena'], ['kosmora'], ['2027', 'delay', 'rinvi']] },
  { id: 'wolf', sector: 'Gaming', title: 'Annunciato The Wolf Among Us Remastered', date: '2026-10-01', reference: 'https://blog.playstation.com/2026/10/01/return-to-fabletown-with-the-wolf-among-us-remastered-out-october-29/', anchors: [['wolf among us'], ['remaster']] },
  { id: 'mw4', sector: 'Gaming', title: 'Modern Warfare 4: trailer e requisiti PC', date: '2026-09-29', reference: 'https://www.callofduty.com/blog/2026/09/call-of-duty-modern-warfare-4-pc-trailer-tech-specs-features', anchors: [['modern warfare 4', 'mw4'], ['pc'], ['trailer', 'spec', 'requisit']] },
  { id: 'etna-airport', sector: 'Locale', title: 'Etna e riapertura dell’aeroporto di Catania', date: '2026-09-29', reference: 'https://www.ansa.it/sito/notizie/cronaca/2026/09/29/si-abbassa-lallerta-volo-torna-operativo-laeroporto-di-catania_0b02f695-7df4-4840-836a-9ca3dc872e8e.html', anchors: [['catania'], ['aeroport', 'airport'], ['etna', 'cenere', 'allerta']] },
  { id: 'processioni', sector: 'Locale', title: 'Acireale: nuove regole per processioni e feste patronali', date: '2026-10-02', reference: 'https://www.lasicilia.it/news/cronaca/3078234/processioni-e-feste-patronali-nuove-linee-guida-basta-ingerenze-politiche-e-pregiudicati-nei-comitati-percorsi-piu-brevi.html', anchors: [['procession', 'feste patronali'], ['raspanti', 'acireale'], ['linee guida', 'decreto', 'comitati']] },
  { id: 'fiera', sector: 'Locale', title: 'Fiera dei Morti: richiesta di tavolo sulla viabilità', date: '2026-10-02', reference: 'https://etnanews24.it/catania-fiera-dei-morti-sindaco-misterbianco-scrive-al-prefetto-tavolo-su-viabilita/', anchors: [['fiera dei morti'], ['misterbianco', 'corsaro', 'nesima'], ['prefetto', 'viabil']] },
  { id: 'librino', sector: 'Locale', title: 'Incendio in una palazzina a Librino', date: '2026-10-02', reference: 'https://etnanews24.it/catania-incendio-in-una-palazzina-a-librino-intervento-dei-pompieri/', anchors: [['librino'], ['incendio', 'fiamme'], ['palazz', 'nitta']] },
  { id: 'cass-34754', sector: 'Diritto', title: 'Cassazione 34754: giustizia riparativa e legittimità', date: '2026-09-30', reference: 'https://www.cortedicassazione.it/it/penale_dettaglio.page?contentId=SZP52359', anchors: [['34754']] },
  { id: 'cass-34813', sector: 'Diritto', title: 'Cassazione 34813: estradizione e retrodatazione delle misure', date: '2026-09-30', reference: 'https://www.cortedicassazione.it/it/penale_dettaglio.page?contentId=SZP52356', anchors: [['34813']] },
  { id: 'cass-34812', sector: 'Diritto', title: 'Cassazione 34812: procedimento De Pasquale–Spadaro', date: '2026-09-30', reference: 'https://www.cortedicassazione.it/it/penale_dettaglio.page?contentId=SZP52362', anchors: [['34812']] },
  { id: 'cass-6868', sector: 'Diritto', title: 'Sezioni Unite: garanzie nelle perquisizioni del difensore', date: '2026-09-24', reference: 'https://www.cortedicassazione.it/it/qsp_dettaglio.page?contentId=QSP51221', anchors: [['6868'], ['103', 'difensor']] },
]
export type CoverageArticle = { id: string; title: string; url: string; excerpt: string | null; published_at: string | null; created_at: string }
function normalize(text: string) { return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[‐‑–—]/g, '-').toLowerCase() }
export function matchesEvent(event: CoverageEvent, article: CoverageArticle) {
  const timestamp = Date.parse(article.published_at || article.created_at)
  if (!Number.isFinite(timestamp) || timestamp < Date.parse(event.date) - 86_400_000 || timestamp > Date.parse(benchmarkCutoff)) return false
  try { if (canonicalArticleUrl(article.url) === canonicalArticleUrl(event.reference)) return true } catch { return false }
  const text = normalize(article.title + ' ' + (article.excerpt || ''))
  return event.anchors.every(group => group.some(anchor => text.includes(normalize(anchor))))
}
export function evaluateCoverage(articles: CoverageArticle[]) {
  const events = benchmarkEvents.map(event => ({ ...event, matches: articles.filter(article => matchesEvent(event, article)).slice(0, 3).map(article => ({ id: article.id, title: article.title, url: article.url, dateUncertain: !article.published_at })) }))
  const covered = events.filter(event => event.matches.length).length
  return { benchmarkId, cutoff: benchmarkCutoff, measuredAt: new Date().toISOString(), scanned: articles.length, covered, total: events.length, percentage: Math.round(covered / events.length * 100), sectors: sectors.map(sector => ({ sector, covered: events.filter(e => e.sector === sector && e.matches.length).length, total: events.filter(e => e.sector === sector).length })), events }
}
export type CoverageReport = ReturnType<typeof evaluateCoverage>
