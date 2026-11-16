'use client'

import React from 'react'
import { buildWhatsappAvailabilityUrl } from '@/lib/whatsapp-availability'

interface WhatsappAvailabilityButtonProps {
  phone?: string | null
  productName: string
  storeName?: string | null
  productId?: string | null
  sku?: string | null
  storeSlug?: string | null
  storeId?: string | null
  className?: string
  compact?: boolean
}

export default function WhatsappAvailabilityButton({
  phone,
  productName,
  storeName,
  productId,
  sku,
  storeSlug,
  storeId,
  className = '',
  compact = false,
}: WhatsappAvailabilityButtonProps) {
  const href = buildWhatsappAvailabilityUrl({
    phone,
    productName,
    storeName,
    productId,
    sku,
    storeSlug,
    storeId,
  })

  const handleTrackClick = () => {
    if (!storeId) return
    const payload = JSON.stringify({ storeId, productId: productId || null })
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon('/api/whatsapp-click', blob)
        return
      }
      fetch('/api/whatsapp-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    } catch {
      // ignore
    }
  }

  const whatsappIcon = (
    <svg
      className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill-current shrink-0`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.188.109-1.922-.125-.453-.141-1.031-.344-1.766-.656-3.094-1.328-5.109-4.453-5.266-4.656-.156-.203-1.266-1.688-1.266-3.219s.797-2.281 1.078-2.594c.281-.313.625-.391.828-.391.203 0 .422.016.609.016.188 0 .453-.078.703.531.266.641.891 2.172.969 2.328.078.156.125.344.031.547-.094.203-.156.344-.313.531-.156.188-.328.406-.469.547-.156.156-.328.328-.141.641.188.313.844 1.391 1.813 2.25 1.25 1.109 2.297 1.453 2.609 1.609.313.156.5.125.688-.078.188-.203.797-.922 1.016-1.234.219-.313.438-.266.719-.156.281.109 1.813.859 2.125 1.016.313.156.516.234.594.359.078.125.078.719-.172 1.422z" />
    </svg>
  )

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleTrackClick}
      className={
        className ||
        (compact
          ? 'w-full text-[12px] bg-[#25D366] hover:bg-[#1EBE5D] text-white px-1.5 py-2 min-h-[52px] font-bold uppercase tracking-tight transition-colors inline-flex items-center justify-center rounded-[2px]'
          : 'mt-1.5 w-full font-heading text-xs bg-[#25D366] hover:bg-[#1EBE5D] text-white px-3 py-2 font-bold uppercase tracking-tight transition-colors flex items-center justify-center gap-1.5 rounded-[2px]')
      }
    >
      {compact ? (
        <span className="flex flex-col items-center justify-center leading-[1.15] text-center">
          <span className="inline-flex items-center gap-1">
            {whatsappIcon}
            <span>VER</span>
          </span>
          <span className="text-[9.5px] tracking-tighter">DISPONIBILIDADE</span>
        </span>
      ) : (
        <>
          {whatsappIcon}
          <span>VER DISPONIBILIDADE</span>
        </>
      )}
    </a>
  )
}
