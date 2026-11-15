import StoreDetailPage from '@/app/loja/[id]/page'

export const instant = false

export default async function StoreRootSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <StoreDetailPage params={Promise.resolve({ id: slug })} />
}
