// Splits at paragraph boundaries where possible; no source text is discarded.
export function translationChunks(body: string, limit = 5000): string[] {
  const chunks:string[]=[]
  let remaining=body
  while(remaining.length>limit){
    const boundary=remaining.lastIndexOf('\n\n',limit)
    const end=boundary>limit/2?boundary:limit
    chunks.push(remaining.slice(0,end));remaining=remaining.slice(end)
  }
  if(remaining)chunks.push(remaining)
  return chunks
}
