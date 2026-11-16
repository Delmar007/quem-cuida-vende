export function buildWhatsappAvailabilityUrl({
  phone,
  productName,
  storeName,
  imageUrl: _imageUrl,
  storeSlug,
  storeId,
}: {
  phone?: string | null
  productName: string
  storeName?: string | null
  imageUrl?: string | null
  storeSlug?: string | null
  storeId?: string | null
}): string {
  const rawDigits = (phone || '').replace(/\D/g, '')
  const phoneDigits =
    rawDigits.length >= 10 && rawDigits.length <= 11 && !rawDigits.startsWith('55')
      ? `55${rawDigits}`
      : rawDigits

  let pageUrl = ''
  const cleanSlug = (storeSlug || '').trim()
  if (cleanSlug) {
    pageUrl = `https://www.kittanda.com.br/${cleanSlug}`
  } else if (storeId) {
    pageUrl = `https://www.kittanda.com.br/loja/${storeId}`
  }

  const lines = ['ESSE ITEM ESTA DISPONIVEL ?', `Produto: ${productName}`]
  if (storeName?.trim()) {
    lines.push(`Loja: ${storeName.trim()}`)
  }
  if (pageUrl) {
    lines.push(`Link: ${pageUrl}`)
  }

  const encoded = encodeURIComponent(lines.join('\n'))
  return phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`
}
