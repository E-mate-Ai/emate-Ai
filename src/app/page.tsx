import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AppLayout from '@/components/AppLayout';
import AITopperChatScreen from './ai-topper-chat/components/AITopperChatScreen';
import SkeletonLoader from '@/components/SkeletonLoader';

export const metadata: Metadata = {
  title: {
    absolute: 'e-Mate AI — AI Study Assistant & Academic Exam Workspace',
  },
  description:
    'e-Mate AI is an intelligent study assistant for students. Anchor sessions to your syllabus, generate interactive flashcards, practice quizzes, and prepare for exams.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'e-Mate AI — AI Study Assistant & Academic Exam Workspace',
    description:
      'e-Mate AI is an intelligent study assistant for students. Anchor sessions to your syllabus, generate interactive flashcards, practice quizzes, and prepare for exams.',
    url: '/',
    siteName: 'e-Mate AI',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'e-Mate AI — Academic Study Workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'e-Mate AI — AI Study Assistant & Academic Exam Workspace',
    description:
      'e-Mate AI is an intelligent study assistant for students. Anchor sessions to your syllabus, generate interactive flashcards, practice quizzes, and prepare for exams.',
    images: ['/opengraph-image.png'],
  },
};

export default function RootHomePage() {
  return (
    <AppLayout>
      <Suspense fallback={<SkeletonLoader />}>
        <AITopperChatScreen />
      </Suspense>
    </AppLayout>
  );
}
