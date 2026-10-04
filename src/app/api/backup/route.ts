import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { requireOwner } from '@/lib/server/auth'
import { getServiceSupabase } from '@/lib/server/clients'
import { apiError } from '@/lib/server/api'
import { backupSchema } from '@/lib/backup/schema'
const headers={'Cache-Control':'private, no-store'}
export async function GET(request:Request) {
 try {
  const owner=await requireOwner(request)
  const {data,error}=await getServiceSupabase().rpc('athena_export_backup',{p_owner:owner.id})
  if(error)throw error
  const backup=backupSchema.parse(data)
  const serialized=JSON.stringify(backup,null,2)
  if(Buffer.byteLength(serialized)>3900000)throw new Error('Backup oltre il limite importabile')
  return new NextResponse(serialized,{headers:{...headers,'Content-Type':'application/json','Content-Disposition':`attachment; filename="athena-backup-${new Date().toISOString().slice(0,10)}.json"`}})
 }catch(error){return apiError(error,'Backup non disponibile: nessun file incompleto è stato esportato')}
}
export async function POST(request:Request){
 try {
  const owner=await requireOwner(request)
  if(Number(request.headers.get('content-length'))>4000000)return NextResponse.json({message:'Backup troppo grande (massimo 4 MB)'},{status:413,headers})
  const raw=await request.text();if(Buffer.byteLength(raw)>4000000)return NextResponse.json({message:'Backup troppo grande (massimo 4 MB)'},{status:413,headers})
  const input=z.object({backup:backupSchema,apply:z.boolean(),fingerprint:z.string().optional()}).strict().parse(JSON.parse(raw))
  const fingerprint=createHash('sha256').update(JSON.stringify(input.backup)).digest('hex')
  if(input.apply&&input.fingerprint!==fingerprint)return NextResponse.json({message:'Ricalcola l’anteprima: il file è cambiato'},{status:409,headers})
  const {data,error}=await getServiceSupabase().rpc('athena_restore_backup',{p_owner:owner.id,p_backup:input.backup,p_apply:input.apply})
  if(error)throw error
  return NextResponse.json({success:true,counts:data,fingerprint},{headers})
 }catch(error){if(error instanceof z.ZodError||error instanceof SyntaxError)return NextResponse.json({message:'Backup non valido o versione non supportata'},{status:400,headers});return apiError(error,'Ripristino non riuscito. Nessun dato è stato modificato')}
}
