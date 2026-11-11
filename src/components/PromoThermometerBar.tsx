'use client'

import React, { useState, useEffect } from 'react'
import {
  getClientFollowedStores,
  toggleClientFollowStore,
  getClientFavoriteProducts,
  toggleClientFavoriteProduct,
} from '@/lib/user-preferences-client'

export interface PromoThermometerProps {
  title?: string | null
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
  variant?: 'banner' | 'card'
  storeId?: string
  productId?: string
  showHeart?: boolean
  className?: string
}

interface TimeMetrics {
  expired: boolean
  remainingPercent: number
  finalizaText: string
  hoursRemaining: number
  totalHours: number
}

function computeThermometerMetrics(
  startDate?: string | null,
  endDate?: string | null
): TimeMetrics {
  const now = Date.now()
  if (!startDate && !endDate) {
    return {
      expired: false,
      remainingPercent: 50,
      finalizaText: 'Finaliza em 5 dias',
      hoursRemaining: 120,
      totalHours: 240,
    }
  }

  const startMs = startDate ? new Date(startDate).getTime() : now - 5 * 24 * 3600 * 1000
  const endMs = endDate ? new Date(endDate).getTime() : now + 5 * 24 * 3600 * 1000

  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
    return {
      expired: false,
      remainingPercent: 50,
      finalizaText: 'Finaliza em 5 dias',
      hoursRemaining: 120,
      totalHours: 240,
    }
  }

  const totalHours = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60)))

  if (now >= endMs) {
    return {
      expired: true,
      remainingPercent: 0,
      finalizaText: 'Campanha encerrada',
      hoursRemaining: 0,
      totalHours,
    }
  }

  const effectiveNow = Math.max(now, startMs)
  const remainingMs = Math.max(0, endMs - effectiveNow)
  const hoursRemaining = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60)))

  // Termômetro que diminui a cada hora até finalizar
  const remainingPercent = Math.min(
    100,
    Math.max(3, Math.round((hoursRemaining / totalHours) * 100))
  )

  const days = Math.ceil(hoursRemaining / 24)
  let finalizaText = ''
  if (hoursRemaining >= 24) {
    finalizaText = `Finaliza em ${days} ${days === 1 ? 'dia' : 'dias'}`
  } else {
    finalizaText = `Finaliza em ${hoursRemaining} ${hoursRemaining === 1 ? 'hora' : 'horas'}`
  }

  return {
    expired: false,
    remainingPercent,
    finalizaText,
    hoursRemaining,
    totalHours,
  }
}

export default function PromoThermometerBar({
  title,
  startDate,
  endDate,
  isActive = true,
  variant = 'banner',
  storeId,
  productId,
  showHeart = true,
  className = '',
}: PromoThermometerProps) {
  const [metrics, setMetrics] = useState<TimeMetrics>(() =>
    computeThermometerMetrics(startDate, endDate)
  )
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    setMetrics(computeThermometerMetrics(startDate, endDate))
    const interval = setInterval(() => {
      setMetrics(computeThermometerMetrics(startDate, endDate))
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [startDate, endDate])

  useEffect(() => {
    const syncLike = () => {
      if (productId) {
        setIsLiked(getClientFavoriteProducts().includes(productId))
      } else if (storeId) {
        setIsLiked(getClientFollowedStores().includes(storeId))
      }
    }
    syncLike()
    window.addEventListener('kittanda:followed-stores-changed', syncLike)
    window.addEventListener('kittanda:favorite-products-changed', syncLike)
    return () => {
      window.removeEventListener('kittanda:followed-stores-changed', syncLike)
      window.removeEventListener('kittanda:favorite-products-changed', syncLike)
    }
  }, [storeId, productId])

  if (!isActive || metrics.expired) return null

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (productId) {
      setIsLiked(toggleClientFavoriteProduct(productId))
    } else if (storeId) {
      setIsLiked(toggleClientFollowStore(storeId))
    } else {
      setIsLiked((prev) => !prev)
    }
  }

  const prefixTitle =
    title && title.trim() ? `${title.trim()} • ` : ''

  return (
    <div
      className={`w-full bg-white border-x border-b border-gray-200 ${
        variant === 'banner' ? 'rounded-b-[16px]' : 'rounded-b-[6px]'
      } overflow-hidden select-none ${className}`}
    >
      <div
        className={`flex items-center justify-between ${
          variant === 'card' ? 'px-3 py-2' : 'px-3.5 py-2.5'
        }`}
      >
        {/* Lado Esquerdo: Ícone de Relógio Circular + "Finaliza em X dias" */}
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className={`${
              variant === 'card' ? 'w-4 h-4' : 'w-[18px] h-[18px]'
            } text-[#8c939d] shrink-0`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
          </svg>
          <span
            className={`${
              variant === 'card' ? 'text-xs' : 'text-[13px]'
            } text-[#7f858d] font-normal truncate`}
          >
            {prefixTitle}
            {metrics.finalizaText}
          </span>
        </div>

        {/* Lado Direito: Coração Outline (Exatamente como nas imagens) */}
        {showHeart && (
          <button
            type="button"
            onClick={handleHeartClick}
            title={
              productId
                ? isLiked
                  ? 'Remover dos Favoritos'
                  : 'Salvar nos Favoritos'
                : isLiked
                ? 'Deixar de seguir loja'
                : 'Seguir esta loja'
            }
            aria-label="Favoritar ou Seguir"
            className="text-[#8c939d] hover:text-[#FB6600] transition-colors cursor-pointer shrink-0 ml-2 flex items-center justify-center"
          >
            <svg
              className={variant === 'card' ? 'w-[19px] h-[19px]' : 'w-[22px] h-[22px]'}
              fill={isLiked ? '#FB6600' : 'none'}
              viewBox="0 0 24 24"
              stroke={isLiked ? '#FB6600' : 'currentColor'}
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Linha de Termômetro Temporal que diminui a cada hora até finalizar */}
      <div className="w-full h-[2.5px] bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-[#FB6600]/80 transition-all duration-500"
          style={{ width: `${metrics.remainingPercent}%` }}
        />
      </div>
    </div>
  )
}
