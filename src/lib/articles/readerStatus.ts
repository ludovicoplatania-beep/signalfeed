export type ContentStatus='full'|'partial'|'unverified'
export function fallbackReader(content:string|null,excerpt:string|null){return {body:content?.trim()||excerpt?.trim()||'',status:'partial' as ContentStatus}}
