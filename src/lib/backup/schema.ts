import { z } from 'zod'
import { canonicalArticleUrl } from '@/lib/articles/identity'
import { alertSettingsSchema } from '@/lib/alerts/rules'
const id = z.string().uuid(), date = z.string().datetime({offset:true})
const url = z.string().max(2048).url().refine(v => { const u=new URL(v); return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password })
const interest = z.object({topic:z.string().max(100),score:z.number().min(0).max(100),origin:z.literal('manual').optional(),mode:z.enum(['prioritize','exclude']).optional(),source_id:id.optional(),learned_at:z.string().optional()}).strict()
export const budgetSchema = z.object({enabled:z.boolean(),monthly_limit_microusd:z.number().int().min(10000).max(1000000000)}).strict()
export const backupSchema = z.object({format:z.literal('athena-backup'),version:z.literal(1),exported_at:date,
 sources:z.array(z.object({key:id,name:z.string().min(1).max(120),website_url:url.nullable(),rss_url:url,is_active:z.boolean(),priority:z.number().int().min(1).max(5)}).strict()).max(2000),
 interests:z.array(interest).max(500),budget:budgetSchema.nullable(),alerts:alertSettingsSchema.nullable(),
 articles:z.array(z.object({key:id,source_key:id,title:z.string().min(1).max(2000),url,canonical_url:z.string().nullable(),excerpt:z.string().max(50000).nullable(),article_content:z.string().max(500000).nullable(),published_at:date.nullable(),image_url:url.nullable()}).strict()).max(5000),
 saved:z.array(z.object({article_key:id,created_at:date.nullable()}).strict()).max(5000),
 library:z.array(z.object({article_key:id,read_at:date.nullable(),folder:z.string().max(80),tags:z.array(z.string().min(1).max(40)).max(12)}).strict()).max(5000),
 feedback:z.array(z.object({article_key:id,preference:z.enum(['like','less_topic','less_source']).nullable()}).strict()).max(5000),
 reader:z.array(z.object({article_key:id,body:z.string().max(500000),content_status:z.enum(['full','partial','unverified']),checked_at:date}).strict()).max(5000),
}).strict().superRefine((b,ctx)=>{
 const sources=new Set(b.sources.map(s=>s.key)),articles=new Set(b.articles.map(a=>a.key))
 const canonical=new Set(b.articles.map(a=>canonicalArticleUrl(a.url)))
 if(sources.size!==b.sources.length||articles.size!==b.articles.length||canonical.size!==b.articles.length)ctx.addIssue({code:'custom',message:'Chiavi o URL duplicati'})
 for(const a of b.articles)if(!sources.has(a.source_key)||!canonicalArticleUrl(a.url))ctx.addIssue({code:'custom',message:'Fonte mancante'})
 for(const list of [b.saved,b.library,b.feedback,b.reader]) {
  if(new Set(list.map(x=>x.article_key)).size!==list.length)ctx.addIssue({code:'custom',message:'Articoli duplicati'})
  for(const x of list)if(!articles.has(x.article_key))ctx.addIssue({code:'custom',message:'Articolo mancante'})
 }
 for(const i of b.interests)if(i.source_id&&!sources.has(i.source_id))ctx.addIssue({code:'custom',message:'Preferenza con fonte mancante'})
}).transform(b=>({...b,articles:b.articles.map(a=>({...a,canonical_url:canonicalArticleUrl(a.url)!}))}))
export type Backup = z.infer<typeof backupSchema>
