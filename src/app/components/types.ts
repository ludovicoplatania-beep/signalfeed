export type Section = 'today' | 'feed' | 'sources' | 'saved' | 'ai' | 'topic'

export type Source = {
  id: string
  name: string
  website_url: string | null
  rss_url: string
  is_active: boolean
  priority: number
  last_checked_at: string | null
  last_success_at: string | null
  last_error: string | null
  last_import_count: number
}

export type Article = {
  id: string
  title: string
  url: string
  excerpt: string | null
  image_url: string | null
  article_content: string | null
  published_at: string | null
  sources: { name: string } | null
}

export type AiPick = {
  id: string
  score: number
  summary: string
  reason: string
  category: string
  created_at: string
  articles: Article | null
}

export type SavedArticle = {
  id: string
  article_id: string
  created_at: string
  articles: Article | null
}

export type Topic = {
  id: string
  title: string
  description: string | null
  score: number
  articles: string[]
}

export type RecommendedArticle = {
  id: string
  title: string
  reason: string
}

export type Digest = {
  id: string
  title: string
  summary: string
  key_points: string[]
  recommended_articles: RecommendedArticle[]
}

export type ToggleSave = (articleId?: string) => Promise<void>
export type OpenReader = (article: Article) => void | Promise<void>
