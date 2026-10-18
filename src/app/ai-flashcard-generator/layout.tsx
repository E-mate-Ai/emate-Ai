import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://emate-ai.runs-on.dev';

export const metadata: Metadata = {
  title: 'AI Flashcard Generator & Visual Study Decks',
  description:
    'Generate interactive AI flashcards and visual study decks for any subject, chapter, or syllabus notes. Practice active recall with spaced repetition and diagrams.',
  keywords: [
    'AI flashcard generator',
    'smart flashcards',
    'visual study cards',
    'active recall flashcards',
    'spaced repetition deck',
    'medical flashcards AI',
    'biology flashcards',
    'exam flashcards',
  ],
  alternates: {
    canonical: '/ai-flashcard-generator',
  },
  openGraph: {
    title: 'AI Flashcard Generator & Visual Study Decks — e-Mate AI',
    description:
      'Generate interactive AI flashcards and visual study decks for any subject, chapter, or syllabus notes. Practice active recall with spaced repetition.',
    url: `${siteUrl}/ai-flashcard-generator`,
    siteName: 'e-Mate AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Flashcard Generator & Visual Study Decks — e-Mate AI',
    description:
      'Generate interactive AI flashcards and visual study decks for any subject, chapter, or syllabus notes.',
  },
};

export default function FlashcardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const flashcardSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'e-Mate AI Flashcard Generator',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    url: `${siteUrl}/ai-flashcard-generator`,
    description:
      'AI flashcard engine that generates illustrated study cards, spaced repetition intervals, and active recall practice from text and notes.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <Script
        id="flashcard-software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(flashcardSchema) }}
      />
      {children}
    </>
  );
}
