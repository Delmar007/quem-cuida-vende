'use client';

import React from 'react';
import Link from 'next/link';

interface EmptyFeedStateProps {
  isAuthenticated?: boolean;
}

export default function EmptyFeedState({ isAuthenticated = true }: EmptyFeedStateProps) {
  return (
    <div className="max-w-md mx-auto text-center py-8 px-4">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/?tipo=lojas"
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm rounded-[4px]"
        >
          Explorar Lojas
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 hover:border-black hover:text-black text-xs font-semibold uppercase tracking-wider transition-colors rounded-[4px]"
        >
          Ver Todas as Ofertas
        </Link>
      </div>
    </div>
  );
}
