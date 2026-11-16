'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getStoreProductsAction } from '@/app/actions/products'
import { StoredProduct } from '@/lib/products-storage'
import { toTitleCase } from '@/lib/textFormat'

interface MerchantSocialMediaTabProps {
  storeId: string
  storeName: string
  storeSlug?: string
  storeLogoUrl?: string | null
  storeInstagramUrl?: string | null
}

function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null)
      return
    }
    const img = new Image()
    if (/^https?:\/\//i.test(src)) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function formatPriceBRL(val: number): string {
  return `R$ ${Number(val || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
      if (lines.length === maxLines) break
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current)
  }
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    const last = lines[maxLines - 1]
    lines[maxLines - 1] = last.length > 3 ? `${last.slice(0, -3)}...` : last
  }
  return lines
}

export default function MerchantSocialMediaTab({
  storeId,
  storeName,
  storeSlug,
  storeLogoUrl,
  storeInstagramUrl,
}: MerchantSocialMediaTabProps) {
  const [products, setProducts] = useState<StoredProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [rendering, setRendering] = useState(false)
  const [copiedBioLink, setCopiedBioLink] = useState(false)
  const [canShareFiles, setCanShareFiles] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const storePublicLink = `kittanda.com.br/${storeSlug || storeId}`
  const instagramHandle = storeInstagramUrl
    ? `@${storeInstagramUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '').replace(/^@/, '')}`
    : ''

  useEffect(() => {
    setCanShareFiles(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    getStoreProductsAction(storeId)
      .then((res) => {
        if (!active) return
        const list = (res.products || []).filter((p) => p.is_active !== false)
        setProducts(list)
        if (list.length > 0) {
          setSelectedProductId(list[0].id)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [storeId])

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0] || null

  // Renderizar card 1:1 (1080x1080) no canvas sempre que produto ou loja mudar
  useEffect(() => {
    if (!selectedProduct || !canvasRef.current) return
    let cancelled = false

    async function renderCard() {
      const canvas = canvasRef.current
      if (!canvas || !selectedProduct) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      setRendering(true)
      const SIZE = 1080
      canvas.width = SIZE
      canvas.height = SIZE

      // Fundo branco limpo
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, SIZE, SIZE)

      // Faixa superior laranja Kittanda
      ctx.fillStyle = '#FB6600'
      ctx.fillRect(0, 0, SIZE, 14)

      // Carregar imagens em paralelo
      const prodImgSrc = selectedProduct.images?.[0] || selectedProduct.image_url || ''
      const [kittandaLogo, storeLogo, prodImg] = await Promise.all([
        loadImageSafe('/logo-kittanda-laranja.png'),
        storeLogoUrl ? loadImageSafe(storeLogoUrl) : Promise.resolve(null),
        prodImgSrc ? loadImageSafe(prodImgSrc) : Promise.resolve(null),
      ])

      if (cancelled) return

      // Cabeçalho (y: 34..136)
      if (kittandaLogo) {
        const logoH = 54
        const logoW = (kittandaLogo.width / Math.max(1, kittandaLogo.height)) * logoH
        ctx.drawImage(kittandaLogo, 52, 46, Math.min(280, logoW), logoH)
      } else {
        ctx.fillStyle = '#FB6600'
        ctx.font = '800 34px sans-serif'
        ctx.fillText('KITTANDA', 52, 86)
      }

      // Logo circular da loja + Nome da loja à direita
      const avatarSize = 72
      const avatarX = SIZE - 52 - avatarSize
      const avatarY = 38

      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      if (storeLogo) {
        const scale = Math.max(avatarSize / storeLogo.width, avatarSize / storeLogo.height)
        const dw = storeLogo.width * scale
        const dh = storeLogo.height * scale
        ctx.drawImage(
          storeLogo,
          avatarX + (avatarSize - dw) / 2,
          avatarY + (avatarSize - dh) / 2,
          dw,
          dh
        )
      } else {
        ctx.fillStyle = '#FB6600'
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '800 32px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(
          (storeName || 'L').charAt(0).toUpperCase(),
          avatarX + avatarSize / 2,
          avatarY + avatarSize / 2
        )
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
      }
      ctx.restore()

      // Borda sutil no avatar da loja
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.stroke()

      // Nome da loja ao lado esquerdo do avatar
      ctx.fillStyle = '#111827'
      ctx.font = '700 24px sans-serif'
      ctx.textAlign = 'right'
      const safeStoreTitle = (storeName || 'Loja Oficial').toUpperCase()
      ctx.fillText(safeStoreTitle.slice(0, 26), avatarX - 18, 74)
      ctx.fillStyle = '#6B7280'
      ctx.font = '600 18px sans-serif'
      ctx.fillText('CATÁLOGO OFICIAL', avatarX - 18, 100)
      ctx.textAlign = 'left'

      // Área da Foto do Produto (y: 146..726)
      const imgBoxX = 52
      const imgBoxY = 144
      const imgBoxW = SIZE - 104
      const imgBoxH = 560

      ctx.fillStyle = '#F9FAFB'
      drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 16)
      ctx.fill()

      if (prodImg) {
        ctx.save()
        drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 16)
        ctx.clip()
        const scale = Math.max(imgBoxW / prodImg.width, imgBoxH / prodImg.height)
        const dw = prodImg.width * scale
        const dh = prodImg.height * scale
        ctx.drawImage(
          prodImg,
          imgBoxX + (imgBoxW - dw) / 2,
          imgBoxY + (imgBoxH - dh) / 2,
          dw,
          dh
        )
        ctx.restore()
      } else {
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '600 26px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Foto do Produto', SIZE / 2, imgBoxY + imgBoxH / 2)
        ctx.textAlign = 'left'
      }

      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 2
      drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 16)
      ctx.stroke()

      // Badge de Desconto se houver promoção
      const hasPromo = Boolean(
        selectedProduct.promotional_price &&
          selectedProduct.promotional_price > 0 &&
          selectedProduct.promotional_price < selectedProduct.price
      )
      const finalPrice = hasPromo ? selectedProduct.promotional_price! : selectedProduct.price
      if (hasPromo) {
        const pct = Math.round(
          ((selectedProduct.price - selectedProduct.promotional_price!) / selectedProduct.price) *
            100
        )
        if (pct > 0) {
          ctx.fillStyle = '#FB6600'
          drawRoundedRect(ctx, imgBoxX + 24, imgBoxY + 24, 152, 52, 26)
          ctx.fill()
          ctx.fillStyle = '#FFFFFF'
          ctx.font = '800 24px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`-${pct}% OFF`, imgBoxX + 100, imgBoxY + 58)
          ctx.textAlign = 'left'
        }
      }

      // Título do Produto (y: 750..845)
      ctx.fillStyle = '#111827'
      ctx.font = '800 38px sans-serif'
      const titleLines = wrapTextLines(
        ctx,
        toTitleCase(selectedProduct.name || 'Produto'),
        SIZE - 104,
        2
      )
      titleLines.forEach((line, i) => {
        ctx.fillText(line, 52, 760 + i * 46)
      })

      // Preço (y: 865..935)
      const priceY = titleLines.length > 1 ? 875 : 835
      if (hasPromo) {
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '600 26px sans-serif'
        const oldText = `De ${formatPriceBRL(selectedProduct.price)}`
        ctx.fillText(oldText, 52, priceY)
        const oldWidth = ctx.measureText(oldText).width
        ctx.strokeStyle = '#9CA3AF'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(52, priceY - 9)
        ctx.lineTo(52 + oldWidth, priceY - 9)
        ctx.stroke()

        ctx.fillStyle = '#FB6600'
        ctx.font = '900 56px sans-serif'
        ctx.fillText(formatPriceBRL(finalPrice), 52, priceY + 62)
      } else {
        ctx.fillStyle = '#FB6600'
        ctx.font = '900 58px sans-serif'
        ctx.fillText(formatPriceBRL(finalPrice), 52, priceY + 46)
      }

      // Rodapé CTA Kittanda (y: 968..1080)
      ctx.fillStyle = '#111827'
      ctx.fillRect(0, 968, SIZE, 112)
      ctx.fillStyle = '#FB6600'
      ctx.font = '800 22px sans-serif'
      ctx.fillText('COMPRE OU RESERVE PELO WHATSAPP NA LOJA FÍSICA', 52, 1012)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '700 28px sans-serif'
      const footerRight = instagramHandle
        ? `${storePublicLink}  •  ${instagramHandle}`
        : storePublicLink
      ctx.fillText(footerRight, 52, 1052)

      setRendering(false)
    }

    renderCard()
    return () => {
      cancelled = true
    }
  }, [selectedProduct, storeName, storeLogoUrl, storePublicLink, instagramHandle])

  const handleDownloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas || !selectedProduct) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const safeFile = (selectedProduct.name || 'anuncio')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
      a.href = url
      a.download = `kittanda_${safeFile}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  const handleNativeShare = async () => {
    const canvas = canvasRef.current
    if (!canvas || !selectedProduct || typeof navigator === 'undefined' || !navigator.share) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'anuncio-kittanda.png', { type: 'image/png' })
      try {
        await navigator.share({
          title: selectedProduct.name,
          text: `Confira ${selectedProduct.name} na ${storeName}: https://${storePublicLink}`,
          files: [file],
        })
      } catch {
        // Fallback para download caso usuário cancele ou device não suporte share de arquivos
        handleDownloadPng()
      }
    }, 'image/png')
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 13 */}
      <div className="bg-white p-6 border border-neutral-200 rounded-[2px] shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-black uppercase text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
            Tópico 13
          </span>
          <span className="text-xs font-bold text-neutral-500">• Instagram & Redes Sociais</span>
        </div>
        <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Gerador de Mídia para Mídias Sociais (PNG 1:1)
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Escolha qualquer produto da sua loja para gerar uma arte quadrada <strong>1:1 (1080×1080px)</strong> pronta para postar no Instagram ou grupos de clientes VIP, com a logo da Kittanda, a logo da sua loja e o preço em destaque.
        </p>

        {/* Dica de Bio do Instagram */}
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-neutral-800">
            <span className="font-bold text-[#FB6600]">Dica para sua Bio do Instagram:</span>{' '}
            use <code className="bg-white px-1.5 py-0.5 border border-orange-200 font-bold">{storePublicLink}</code> como seu Catálogo Oficial!
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(`https://${storePublicLink}`)
              setCopiedBioLink(true)
              setTimeout(() => setCopiedBioLink(false), 2000)
            }}
            className="px-3 py-1 bg-[#FB6600] hover:bg-[#e05b00] text-white text-[11px] font-bold uppercase rounded cursor-pointer"
          >
            {copiedBioLink ? 'Link Copiado!' : 'Copiar Link da Bio'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 bg-white border border-neutral-200 text-center text-xs text-neutral-500">
          Carregando produtos da loja...
        </div>
      ) : products.length === 0 ? (
        <div className="p-10 bg-white border border-dashed border-neutral-300 text-center space-y-2">
          <p className="text-sm font-bold text-neutral-800">
            Nenhum produto ativo cadastrado ainda.
          </p>
          <p className="text-xs text-neutral-500">
            Cadastre seus produtos no Tópico 07 para gerar imagens de anúncio 1:1 para o Instagram.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Seleção de Produto */}
          <div className="lg:col-span-5 bg-white border border-neutral-200 p-4 rounded-[2px] shadow-2xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-2">
              1. Escolha o Card da Loja ({products.length})
            </h3>
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {products.map((prod) => {
                const isSelected = selectedProduct?.id === prod.id
                const img = prod.images?.[0] || prod.image_url
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => setSelectedProductId(prod.id)}
                    className={`w-full text-left p-2.5 border rounded flex items-center gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#FB6600] bg-orange-50/70'
                        : 'border-neutral-200 hover:border-neutral-400 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                      {img ? (
                        <img src={img} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                          🛍️
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {toTitleCase(prod.name)}
                      </p>
                      <p className="text-xs font-extrabold text-[#FB6600]">
                        {formatPriceBRL(
                          prod.promotional_price && prod.promotional_price < prod.price
                            ? prod.promotional_price
                            : prod.price
                        )}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold uppercase text-[#FB6600] shrink-0">
                        Selecionado
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Coluna Direita: Preview 1:1 e Exportação PNG */}
          <div className="lg:col-span-7 bg-white border border-neutral-200 p-5 rounded-[2px] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
                2. Prévia do Anúncio (1:1 • PNG 1080×1080)
              </h3>
              {rendering && (
                <span className="text-[11px] font-semibold text-[#FB6600]">Gerando...</span>
              )}
            </div>

            <div className="w-full max-w-[440px] mx-auto aspect-square border border-neutral-200 shadow-sm bg-neutral-50 overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="px-5 py-3 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-extrabold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-xs"
              >
                ⬇ Baixar PNG (PC ou Celular)
              </button>
              {canShareFiles && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="px-5 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-extrabold uppercase tracking-wider rounded transition-colors cursor-pointer"
                >
                  📲 Enviar para Instagram / WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
