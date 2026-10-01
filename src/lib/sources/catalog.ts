// Publisher feeds or official pages advertising feeds. Only live, recent RSS/Atom
// feeds are added; this list is a set of candidates, not a claim of availability.
export const sourceCatalog = [
  { name: 'ANSA · Ultime notizie', site: 'https://www.ansa.it', feed: 'https://www.ansa.it/sito/ansait_rss.xml', topic: 'Attualità italiana' },
  { name: 'Adnkronos', site: 'https://www.adnkronos.com', feed: 'https://www.adnkronos.com/rss', topic: 'Attualità italiana' },
  { name: 'Il Fatto Quotidiano', site: 'https://www.ilfattoquotidiano.it', feed: 'https://www.ilfattoquotidiano.it/feed/', topic: 'Politica e cronaca' },
  { name: 'LiveSicilia', site: 'https://livesicilia.it', feed: 'https://livesicilia.it/feed/', topic: 'Sicilia' },
  { name: 'IlSicilia', site: 'https://ilsicilia.it', feed: 'https://ilsicilia.it/feed/', topic: 'Sicilia' },
  { name: 'CataniaToday', site: 'https://www.cataniatoday.it', feed: 'https://www.cataniatoday.it', topic: 'Catania' },
  { name: 'PalermoToday', site: 'https://www.palermotoday.it', feed: 'https://www.palermotoday.it', topic: 'Palermo' },
  { name: 'BBC · Mondo', site: 'https://www.bbc.com/news', feed: 'https://feeds.bbci.co.uk/news/world/rss.xml', topic: 'Esteri' },
  { name: 'Euronews · Italiano', site: 'https://it.euronews.com', feed: 'https://it.euronews.com/rss?format=mrss&level=theme&name=news', topic: 'Esteri' },
  { name: 'Eunews', site: 'https://www.eunews.it', feed: 'https://www.eunews.it/feed/', topic: 'Unione europea' },
  { name: 'Lavoce.info', site: 'https://lavoce.info', feed: 'https://lavoce.info/feed/', topic: 'Economia' },
  { name: 'ScienceDaily', site: 'https://www.sciencedaily.com', feed: 'https://www.sciencedaily.com/rss/top.xml', topic: 'Scienza e salute' },
  { name: 'Nature', site: 'https://www.nature.com', feed: 'https://www.nature.com/nature.rss', topic: 'Ricerca scientifica' },
  { name: 'Focus', site: 'https://www.focus.it', feed: 'https://www.focus.it', topic: 'Scienza e cultura' },
  { name: 'Agenda Digitale', site: 'https://www.agendadigitale.eu', feed: 'https://www.agendadigitale.eu/feed/', topic: 'Digitale e società' },
  { name: 'GreenMe', site: 'https://www.greenme.it', feed: 'https://www.greenme.it/feed/', topic: 'Ambiente e benessere' },
  { name: 'Diritto.it', site: 'https://www.diritto.it', feed: 'https://www.diritto.it/feed/', topic: 'Diritto e giustizia' },
  { name: 'NASA · News', site: 'https://www.nasa.gov', feed: 'https://www.nasa.gov/feed/', topic: 'Spazio' },
] as const
