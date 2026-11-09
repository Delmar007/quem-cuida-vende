import React from 'react';
import FeedClient from '@/components/FeedClient';

export const metadata = {
  title: 'Meu Feed de Ofertas | Kittanda Outlet',
  description: 'Acompanhe as promoções e novidades exclusivas das lojas físicas que você segue no Kittanda Outlet.',
};

export default function FeedPage() {
  return <FeedClient />;
}
