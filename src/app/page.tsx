import Dashboard from './components/dashboard'
import type { Section } from './components/types'
export default async function HomePage({ searchParams }: { searchParams: Promise<{ sezione?: string }> }) {
  const { sezione } = await searchParams
  const initialSection = ['today','feed','ai','saved','sources','events'].includes(sezione ?? '') ? sezione as Section : 'today'
  return <Dashboard initialSection={initialSection} />
}
