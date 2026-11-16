import React from 'react'

export default function DefaultStoreAvatar({
  size = 'sm',
}: {
  size?: 'sm' | 'md' | 'lg'
}) {
  const iconClass =
    size === 'lg' ? 'w-11 h-11' : size === 'md' ? 'w-9 h-9' : 'w-3 h-3'

  return (
    <div
      className="w-full h-full bg-gradient-to-br from-[#FB6600] to-[#e05b00] text-white flex items-center justify-center select-none"
      aria-label="Kittanda"
    >
      <svg
        className={iconClass}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
    </div>
  )
}
