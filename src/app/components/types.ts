export type Section = 'today' | 'feed' | 'sources' | 'saved' | 'ai' | 'topic'

export type Source = {
  id: string
  name: string
  website_url: string | null
  rss_url: string
  is_active: boolean
  priority: number
}
