import {expect,it} from 'vitest'
import {backupSchema} from './schema'
const s='00000000-0000-4000-8000-000000000001',a='00000000-0000-4000-8000-000000000002'
const base={format:'athena-backup',version:1,exported_at:new Date().toISOString(),sources:[{key:s,name:'Test',rss_url:'https://example.com/feed',website_url:null,is_active:true,priority:3}],interests:[],budget:null,alerts:null,articles:[{key:a,source_key:s,title:'Title',url:'https://example.com/a?utm_source=x',canonical_url:'https://attacker.example',excerpt:null,article_content:null,published_at:null,image_url:null}],saved:[{article_key:a,created_at:null}],library:[],feedback:[],reader:[]}
it('recalculates canonical URLs and rejects secret fields or broken references',()=>{
 expect(backupSchema.parse(base).articles[0].canonical_url).toBe('https://example.com/a')
 expect(backupSchema.safeParse({...base,api_key:'secret'}).success).toBe(false)
 expect(backupSchema.safeParse({...base,sources:[]}).success).toBe(false)
 expect(backupSchema.safeParse({...base,articles:[base.articles[0],base.articles[0]]}).success).toBe(false)
 expect(backupSchema.safeParse({...base,version:2}).success).toBe(false)
})
