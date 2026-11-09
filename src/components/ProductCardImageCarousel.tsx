'use client'

import React, { useState } from 'react'

interface ProductCardImageCarouselProps {
  images: string[]
  alt: string
  photoOrientation?: 'vertical' | 'horizontal'
  promoBadgeLabel: string
  subcategory?: string | null
  hasDiscount?: boolean
  discountPercent?: number | null
  onImageClick?: () => void
  compact?: boolean
}

export default function ProductCardImageCarousel({
  images,
  alt,
  photoOrientation = 'vertical',
  promoBadgeLabel,
  subcategory,
  hasDiscount = false,
  discountPercent = null,
  onImageClick,
  compact = false,
}: ProductCardImageCarouselProps) {
  const validImages = images.filter(Boolean)
  const [currentIndex, setCurrentIndex] = useState(0)

  const total = validImages.length
  const currentSrc = total > 0 ? validImages[currentIndex % total] : null

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (total <= 1) return
    setCurrentIndex((prev) => (prev - 1 + total) % total)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (total <= 1) return
    setCurrentIndex((prev) => (prev + 1) % total)
  }

  return (
    <div
      onClick={onImageClick}
      className={`${
        photoOrientation === 'horizontal' ? 'aspect-[16/10] bg-gray-100' : 'aspect-[4/5] bg-gray-50'
      } w-full overflow-hidden relative border-b border-gray-100 ${
        onImageClick ? 'cursor-pointer' : ''
      } flex items-center justify-center select-none shrink-0`}
    >
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
          Sem foto
        </div>
      )}

      {/* Setas nas Laterais (Esquerda e Direita) para Visualizar o Próximo Veículo / Foto */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Anterior"
        title="Visualizar anterior"
        className={`absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 z-20 ${
          compact ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'
        } rounded-full bg-black/55 hover:bg-black/85 active:scale-95 text-white flex items-center justify-center shadow-md border border-white/25 backdrop-blur-[2px] transition-all cursor-pointer`}
      >
        <svg
          className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Próximo"
        title="Visualizar próximo"
        className={`absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-20 ${
          compact ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'
        } rounded-full bg-black/55 hover:bg-black/85 active:scale-95 text-white flex items-center justify-center shadow-md border border-white/25 backdrop-blur-[2px] transition-all cursor-pointer`}
      >
        <svg
          className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicador discreto de paginação quando houver múltiplas imagens */}
      {total > 1 && (
        <div className="absolute top-2.5 right-2.5 z-10 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] backdrop-blur-[2px]">
          {(currentIndex % total) + 1}/{total}
        </div>
      )}

      {/* Badge do Tipo de Promoção no Canto Superior Esquerdo */}
      <div
        className={`absolute ${
          compact ? 'top-1.5 left-1.5' : 'top-2.5 left-2.5'
        } z-10 flex flex-col gap-1 items-start`}
      >
        <span
          className={`bg-[#FB6600] text-white ${
            compact ? 'text-[8.5px] px-1.5 py-0.5' : 'text-[9.5px] px-2 py-0.5'
          } uppercase tracking-wider font-bold shadow-sm`}
        >
          {promoBadgeLabel}
        </span>
      </div>

      {/* Tag da Subcategoria no Canto Inferior Esquerdo */}
      {subcategory && (
        <div
          className={`absolute ${
            compact ? 'bottom-1.5 left-1.5 text-[8px] px-1.5' : 'bottom-2.5 left-2.5 text-[9px] px-2'
          } z-10 bg-white/90 backdrop-blur-[2px] text-gray-800 uppercase tracking-wider py-0.5 font-semibold`}
        >
          {subcategory}
        </div>
      )}

      {/* Círculo Pequeno Amarelo (33x33px) com Percentual de Desconto em Preto no Canto Inferior Direito */}
      {hasDiscount && discountPercent && discountPercent > 0 && (
        <div
          className={`absolute ${
            compact ? 'bottom-1.5 right-1.5' : 'bottom-2.5 right-2.5'
          } z-10 w-[33px] h-[33px] rounded-full bg-yellow-400 text-black font-black text-[10.5px] flex items-center justify-center shadow-md border border-yellow-500/40 select-none`}
        >
          {discountPercent}%
        </div>
      )}
    </div>
  )
}
