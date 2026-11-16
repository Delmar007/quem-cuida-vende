import type { Metadata } from 'next'
import StoreDetailPage, {
  generateMetadata as generateStoreMetadata,
} from '@/app/loja/[id]/page'

export const instant = false

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ produto?: string; p?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return generateStoreMetadata({
    params: Promise.resolve({ id: slug }),
    searchParams,
  })
}

export default async function StoreRootSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ produto?: string; p?: string }>
}) {
  const { slug } = await params
  return (
    <StoreDetailPage
      params={Promise.resolve({ id: slug })}
      searchParams={searchParams}
    />
  )
}
