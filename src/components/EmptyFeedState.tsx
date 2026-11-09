'use client';

import React from 'react';
import Link from 'next/link';

interface EmptyFeedStateProps {
  isAuthenticated?: boolean;
}

export default function EmptyFeedState({ isAuthenticated = true }: EmptyFeedStateProps) {
  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 bg-orange-50 text-[#FB6600] rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-8 h-8 stroke-[1.5]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {isAuthenticated ? 'Você ainda não segue nenhuma loja' : 'Entre para ver seu Feed'}
      </h3>

      <p className="text-sm text-gray-600 mb-8 leading-relaxed">
        {isAuthenticated
          ? 'Você ainda não está seguindo nenhuma loja. Explore a Kittanda Outlet, encontre suas lojas favoritas e acompanhe as melhores ofertas!'
          : 'Faça login com sua conta para acompanhar as novidades e promoções exclusivas das suas lojas favoritas.'}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/?tipo=lojas"
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-black hover:bg-[#FB6600] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
        >
          Explorar Lojas
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 hover:border-black hover:text-black text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          Ver Todas as Ofertas
        </Link>
      </div>
    </div>
  );
}
