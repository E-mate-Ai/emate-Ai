import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AppLayout from '@/components/AppLayout';
import AITopperChatScreen from './ai-topper-chat/components/AITopperChatScreen';
import SkeletonLoader from '@/components/SkeletonLoader';

export const metadata: Metadata = {
  title: 'AI Study Assistant for Students | e-Mate',
  description:
    'e-Mate is an AI study assistant for students to build personalized study plans, revise smarter, practice with quizzes, and prepare for exams with more confidence.',
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
