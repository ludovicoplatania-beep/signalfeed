import { notFound } from 'next/navigation'
import Dashboard from '@/app/components/dashboard'
import { getSector } from '@/lib/sectors/catalog'
export default async function SectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!getSector(slug)) notFound()
  return <Dashboard initialSector={slug} />
}
