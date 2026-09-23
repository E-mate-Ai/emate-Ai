import React from 'react';
import type { Metadata } from 'next';
import UpgradeClient from './UpgradeClient';

export const metadata: Metadata = {
  title: 'Pricing & Pro Plans — e-Mate AI',
  description:
    'Choose your e-Mate AI plan: Plus, Pro, or Ultra. Unlock unlimited flashcards, advanced AI reasoning, and priority study compute.',
  alternates: {
    canonical: '/upgrade',
  },
};

export default function UpgradePage() {
  return <UpgradeClient />;
}
