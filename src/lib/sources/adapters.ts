export type SourceRecord = {
  id: string
  user_id: string
  name: string
  website_url: string | null
  rss_url: string
  is_active: boolean
  priority: number
  resolved_feed_url?: string | null
}

export type SourceAdapter = {
  match: (source: SourceRecord) => boolean
  feedUrls: (source: SourceRecord) => string[]
  pageUrls?: string[]
  articlePattern?: RegExp
}

function text(source: SourceRecord) {
  return `${source.name ?? ''} ${source.website_url ?? ''} ${source.rss_url ?? ''}`.toLowerCase()
}

export const sourceAdapters: SourceAdapter[] = [
  {
    match: (source) => text(source).includes('everyeye') && (text(source).includes('serie') || text(source).includes('serial')),
    feedUrls: () => ['https://serial.everyeye.it/feed/feed_news_rss.asp'],
    pageUrls: ['https://serial.everyeye.it/'],
    articlePattern: /^\/(notizie|articoli)\/[^/]+-\d+\.html$/,
  },
  {
    match: (source) => text(source).includes('mymovies'),
    feedUrls: () => [],
    pageUrls: ['https://www.mymovies.it/cinemanews/'],
    articlePattern: /^\/cinemanews\/\d{4}\/\d+\/?$/,
  },
  {
    match: (source) => text(source).includes('cycleworld'),
    feedUrls: () => ['https://www.cycleworld.com/feed/'],
    pageUrls: ['https://www.cycleworld.com/latest/'],
    articlePattern: /^\/(?:story\/)?(bikes|motorcycle-news|motorcycle-reviews|racing|blogs|news|reviews)\/.+/,
  },
  {
    match: (source) => text(source).includes('internazionale'),
    feedUrls: () => ['https://www.internazionale.it/sitemaps/rss.xml'],
  },
  {
    match: (source) => text(source).includes('animeclick'),
    feedUrls: () => [],
    pageUrls: ['https://www.animeclick.it/news'],
    articlePattern: /^\/news\/\d+-/,
  },
  {
    match: (source) => text(source).includes('automoto.it'),
    feedUrls: () => ['https://www.automoto.it/rss/news.xml'],
    pageUrls: ['https://www.automoto.it/servizio/rss.html', 'https://www.automoto.it/news'],
    articlePattern: /^\/(news|prove|formula1)\/.+\.html$/,
  },
  {
    match: (source) => text(source).includes('slow-news'),
    feedUrls: () => [],
    pageUrls: ['https://slow-news.com/stream'],
    articlePattern: /^\/(stream|articoli|articles|news)\/.+/,
  },
  {
    match: (source) => text(source).includes('pagella politica') || text(source).includes('pagellapolitica'),
    feedUrls: () => [],
    pageUrls: ['https://pagellapolitica.it/articoli'],
    articlePattern: /^\/articoli\/.+/,
  },
  {
    match: (source) => text(source).includes('wired'),
    feedUrls: () => [
      'https://www.wired.it/feed/rss',
      'https://www.wired.it/feed',
    ],
  },
  {
    match: (source) => text(source).includes('dday'),
    feedUrls: () => [
      'https://www.dday.it/feed',
      'https://www.dday.it/rss',
    ],
  },
  {
    match: (source) => text(source).includes('moto.it'),
    feedUrls: () => ['https://www.moto.it/rss/news.xml'],
    pageUrls: ['https://www.moto.it/rss', 'https://www.moto.it/news'],
    articlePattern: /^\/(news|prove|MotoGP|sport)\/.+\.html$/i,
  },
  {
    match: (source) => text(source).includes('quattroruote'),
    feedUrls: () => [
      'https://www.quattroruote.it/rss',
    ],
    pageUrls: ['https://www.quattroruote.it/news/'],
    articlePattern: /^\/news\/(?:[^/]+\/)?\d{4}\/\d{2}\/\d{2}\/.+/,
  },
  {
    match: (source) => text(source).includes('badtaste'),
    feedUrls: () => [
      'https://www.badtaste.it/feed',
      'https://www.badtaste.it/tv/feed',
    ],
  },
  {
    match: (source) => text(source).includes('vulture'),
    feedUrls: () => [
      'https://www.vulture.com/rss/index.xml',
      'https://www.vulture.com/rss/tv/index.xml',
    ],
    pageUrls: ['https://www.vulture.com/'],
    articlePattern: /^\/article\/.+\.html$/,
  },
  {
    match: (source) => text(source).includes('ringer'),
    feedUrls: () => [
      'https://www.theringer.com/rss/index.xml',
      'https://www.theringer.com/tv/rss/index.xml',
    ],
    pageUrls: ['https://www.theringer.com/'],
    articlePattern: /^\/(\d{4}|movies|tv|pop-culture)\/.+/,
  },
  {
    match: (source) => text(source).includes('home assistant'),
    feedUrls: () => [
      'https://www.home-assistant.io/atom.xml',
      'https://www.home-assistant.io/blog/atom.xml',
    ],
  },
  {
    match: (source) => text(source).includes('screen anarchy'),
    feedUrls: () => [
      'https://screenanarchy.com/globalvoices/atom.xml',
      'https://screenanarchy.com/atom.xml',
    ],
    pageUrls: ['https://screenanarchy.com/'],
    articlePattern: /^\/\d{4}\/\d{2}\/.+\.html$/,
  },
]
