import { NextResponse } from 'next/server'
import { requireOwner,enforceRateLimit } from '@/lib/server/auth'
import { apiError } from '@/lib/server/api'
import { runAlerts } from '@/lib/alerts/server'
export const maxDuration=60
export async function POST(request:Request){try{const owner=await requireOwner(request);enforceRateLimit(`alerts-check:${owner.id}`,2);const result=await runAlerts(owner.id);return NextResponse.json({success:true,...result},{headers:{'Cache-Control':'private, no-store'}})}catch(error){return apiError(error,'Verifica avvisi non riuscita')}}
