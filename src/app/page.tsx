import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AppLayout from '@/components/AppLayout';
import AITopperChatScreen from './ai-topper-chat/components/AITopperChatScreen';
import SkeletonLoader from '@/components/SkeletonLoader';

export const metadata: Metadata = {
  title: 'e-Mate AI – AI Study Assistant for Students',
  description:
    'e-Mate AI is an AI-powered study assistant that helps students plan their preparation, understand concepts, practice with quizzes, revise effectively, and prepare for exams.',
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
