import Dashboard from './components/dashboard'
import type { Section } from './components/types'
export default async function HomePage({ searchParams }: { searchParams: Promise<{ sezione?: string;avviso?:string }> }) {
  const { sezione,avviso } = await searchParams
  const initialSection = ['today','feed','ai','saved','sources','events'].includes(sezione ?? '') ? sezione as Section : 'today'
  return <Dashboard initialSection={initialSection} initialAlert={avviso&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(avviso)?avviso:undefined} />
}
