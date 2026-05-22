export type SourceAdapter = {
  match: (source: any) => boolean
  feedUrls: (source: any) => string[]
}

function text(source: any) {
  return `${source.name ?? ''} ${source.website_url ?? ''} ${source.rss_url ?? ''}`.toLowerCase()
}

export const sourceAdapters: SourceAdapter[] = [
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
    match: (source) => text(source).includes('pagella politica'),
    feedUrls: () => [
      'https://pagellapolitica.it/feed',
      'https://pagellapolitica.it/rss',
    ],
  },
  {
    match: (source) => text(source).includes('moto.it'),
    feedUrls: () => [
      'https://www.moto.it/rss',
      'https://www.moto.it/news/rss.xml',
    ],
  },
  {
    match: (source) => text(source).includes('quattroruote'),
    feedUrls: () => [
      'https://www.quattroruote.it/rss/news.xml',
      'https://www.quattroruote.it/rss',
    ],
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
  },
  {
    match: (source) => text(source).includes('ringer'),
    feedUrls: () => [
      'https://www.theringer.com/rss/index.xml',
      'https://www.theringer.com/tv/rss/index.xml',
    ],
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
  },
]