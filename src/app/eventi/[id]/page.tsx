import {notFound} from 'next/navigation'
import {z} from 'zod'
import Dashboard from '@/app/components/dashboard'
export default async function EventPage({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!z.string().uuid().safeParse(id).success)notFound();return <Dashboard initialSection="events" initialEvent={id}/>}
