'use client'

import React, { useState, useEffect } from 'react'
import {
  getClientFavoriteProducts,
  toggleClientFavoriteProduct,
} from '@/lib/user-preferences-client'

interface FavoriteProductButtonProps {
  productId: string
  className?: string
}

export default function FavoriteProductButton({
  productId,
  className = '',
}: FavoriteProductButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const check = () => {
      const list = getClientFavoriteProducts()
      setIsFavorite(list.includes(productId))
    }
    check()
    window.addEventListener('kittanda:favorite-products-changed', check)
    return () => window.removeEventListener('kittanda:favorite-products-changed', check)
  }, [productId])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = toggleClientFavoriteProduct(productId)
    setIsFavorite(next)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={
        className ||
        `w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-2xs ${
          isFavorite
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : 'bg-white hover:bg-neutral-50 border-gray-200 text-gray-400 hover:text-rose-500'
        }`
      }
    >
      <svg
        className="w-4 h-4"
        fill={isFavorite ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  )
}
