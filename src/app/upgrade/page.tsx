import React from 'react';
import type { Metadata } from 'next';
import UpgradeClient from './UpgradeClient';

export const metadata: Metadata = {
  title: 'Pricing & Pro Plans',
  description:
    'Choose your e-Mate AI plan: Plus, Pro, or Ultra. Unlock unlimited flashcards, advanced AI reasoning, and priority study compute.',
  keywords: [
    'e-Mate AI pricing',
    'student AI subscription',
    'pro study tools',
    'AI flashcards pro',
    'e-Mate AI',
    'emate.live',
  ],
  alternates: {
    canonical: '/upgrade',
  },
  openGraph: {
    title: 'Pricing & Pro Plans — e-Mate AI',
    description:
      'Choose your e-Mate AI plan: Plus, Pro, or Ultra. Unlock unlimited flashcards, advanced AI reasoning, and priority study compute.',
    url: '/upgrade',
    siteName: 'e-Mate AI',
    type: 'website',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing & Pro Plans — e-Mate AI',
    description:
      'Choose your e-Mate AI plan: Plus, Pro, or Ultra. Unlock unlimited flashcards, advanced AI reasoning, and priority study compute.',
    images: ['/opengraph-image.png'],
  },
};

export default function UpgradePage() {
  return <UpgradeClient />;
}
