import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AppLayout from '@/components/AppLayout';
import AITopperChatScreen from './components/AITopperChatScreen';
import SkeletonLoader from '@/components/SkeletonLoader';

export const metadata: Metadata = {
  title: 'AI Study Workspace & Exam Copilot — e-Mate AI',
  description:
    'Interactive AI study workspace with syllabus context anchoring, smart flashcards, practice quizzes, and real-time document explanations.',
  alternates: {
    canonical: '/ai-topper-chat',
  },
};

export default function AITopperPage() {
  return (
    <AppLayout>
      <Suspense fallback={<SkeletonLoader />}>
        <AITopperChatScreen />
      </Suspense>
    </AppLayout>
  );
}
