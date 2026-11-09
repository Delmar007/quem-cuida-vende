'use client'

import React, { useState, useEffect } from 'react'
import {
  getClientFollowedStores,
  toggleClientFollowStore,
} from '@/lib/user-preferences-client'

interface FollowStoreButtonProps {
  storeId: string
  storeSlug?: string
  compact?: boolean
  className?: string
}

export default function FollowStoreButton({
  storeId,
  storeSlug,
  compact = false,
  className = '',
}: FollowStoreButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    const check = () => {
      const list = getClientFollowedStores()
      setIsFollowing(list.includes(storeId) || (storeSlug ? list.includes(storeSlug) : false))
    }
    check()
    window.addEventListener('kittanda:followed-stores-changed', check)
    return () => window.removeEventListener('kittanda:followed-stores-changed', check)
  }, [storeId, storeSlug])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const next = toggleClientFollowStore(storeId)
    setIsFollowing(next)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ||
        (compact
          ? `px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 ${
              isFollowing
                ? 'bg-[#FB6600] text-white border border-[#FB6600]'
                : 'bg-white/95 hover:bg-black text-neutral-900 hover:text-white border border-neutral-300'
            }`
          : `w-full py-2 px-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 rounded-[2px] cursor-pointer border ${
              isFollowing
                ? 'bg-[#FB6600] hover:bg-[#e05b00] text-white border-[#FB6600]'
                : 'bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300 hover:border-black'
            }`)
      }
      title={isFollowing ? 'Deixar de seguir esta loja' : 'Seguir esta loja para ver no seu Feed que sigo'}
    >
      <span>{isFollowing ? '✓ Seguindo' : '+ Seguir Loja'}</span>
    </button>
  )
}
