import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return {
    title: "You've been invited to e-Mate AI — Smart Study Copilot",
    description:
      'Join 10,000+ students using e-Mate AI to ace every exam. Your friend invited you — sign up free and claim your reward tokens!',
    openGraph: {
      title: "You've been invited to e-Mate AI — Smart Study Copilot",
      description:
        'AI-powered study workspace with instant flashcards, syllabus context RAG, active recall quizzes & multi-model AI reasoning.',
      images: ['/opengraph-image'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: "You've been invited to e-Mate AI",
      description: 'Join 10,000+ students using e-Mate AI to ace every exam.',
      images: ['/opengraph-image'],
    },
  };
}

export { default } from './page';
