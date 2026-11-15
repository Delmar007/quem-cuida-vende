export function buildWhatsappAvailabilityUrl({
  phone,
  productName,
  imageUrl,
  storeSlug,
  storeId,
}: {
  phone?: string | null
  productName: string
  imageUrl?: string | null
  storeSlug?: string | null
  storeId?: string | null
}): string {
  const rawDigits = (phone || '').replace(/\D/g, '')
  const phoneDigits =
    rawDigits.length >= 10 && rawDigits.length <= 11 && !rawDigits.startsWith('55')
      ? `55${rawDigits}`
      : rawDigits

  let photoOrPageUrl = ''
  const trimmedImg = (imageUrl || '').trim()
  if (/^https?:\/\//i.test(trimmedImg)) {
    photoOrPageUrl = trimmedImg
  } else if (trimmedImg.startsWith('/')) {
    photoOrPageUrl = `https://www.kittanda.com.br${trimmedImg}`
  } else if (storeSlug) {
    photoOrPageUrl = `https://www.kittanda.com.br/${storeSlug}`
  } else if (storeId) {
    photoOrPageUrl = `https://www.kittanda.com.br/loja/${storeId}`
  }

  const lines = ['ESSE ITEM ESTA DISPONIVEL ?', productName]
  if (photoOrPageUrl) {
    lines.push(photoOrPageUrl)
  }

  const encoded = encodeURIComponent(lines.join('\n'))
  return phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`
}
