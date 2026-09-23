import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AppLayout from '@/components/AppLayout';
import AITopperChatScreen from './ai-topper-chat/components/AITopperChatScreen';
import SkeletonLoader from '@/components/SkeletonLoader';

export const metadata: Metadata = {
  title: 'e-Mate AI — Smart Study Copilot & Academic Topper Workspace',
  description:
    'Accelerate your learning with AI flashcards, active recall quizzes, interactive note summarization, and syllabus-anchored study assistance.',
  alternates: {
    canonical: '/',
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
