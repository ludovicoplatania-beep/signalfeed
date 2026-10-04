export function speechChunks(text:string,maxLength=240){
 const words=text.replace(/\s+/g,' ').trim().split(' ').filter(Boolean),chunks:string[]=[];let chunk=''
 for(const word of words){if(chunk&&chunk.length+word.length+1>maxLength){chunks.push(chunk);chunk=''}
 if(word.length>maxLength){if(chunk){chunks.push(chunk);chunk=''}for(let i=0;i<word.length;i+=maxLength)chunks.push(word.slice(i,i+maxLength))}else chunk+=(chunk?' ':'')+word}
 if(chunk)chunks.push(chunk);return chunks
}
