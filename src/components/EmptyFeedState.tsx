'use client';

import React from 'react';
import Link from 'next/link';

interface EmptyFeedStateProps {
  isAuthenticated?: boolean;
}

export default function EmptyFeedState({ isAuthenticated = true }: EmptyFeedStateProps) {
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-8 px-4">
        <p className="text-xs text-gray-500">
          Faça login para acompanhar as ofertas das lojas que você segue.
        </p>
      </div>
    );
  }
  return null;
}
