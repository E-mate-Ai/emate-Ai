import type { Metadata } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://emate-ai.runs-on.dev';

export function generateMetadata(): Metadata {
  const ogImage = {
    url: `${siteUrl}/invite-og.png`,
    width: 1672,
    height: 941,
    alt: "You're invited to join e-Mate AI — Smart Study Copilot",
    type: 'image/png' as const,
  };

  return {
    title: "You've been invited to e-Mate AI — Smart Study Copilot",
    description:
      'Join 10,000+ students using e-Mate AI to ace every exam. Your friend invited you — sign up free and claim your reward tokens!',
    openGraph: {
      title: "You've been invited to e-Mate AI — Smart Study Copilot",
      description:
        'AI-powered study workspace with instant flashcards, syllabus context RAG, active recall quizzes & multi-model AI reasoning.',
      images: [ogImage],
      type: 'website',
      siteName: 'e-Mate AI',
    },
    twitter: {
      card: 'summary_large_image',
      title: "You've been invited to e-Mate AI",
      description: 'Join 10,000+ students using e-Mate AI to ace every exam. Sign up free!',
      images: [`${siteUrl}/invite-og.png`],
    },
  };
}

export { default } from './page';

