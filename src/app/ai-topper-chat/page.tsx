import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AppLayout from '@/components/AppLayout';
import AITopperChatScreen from './components/AITopperChatScreen';

import SkeletonLoader from '@/components/SkeletonLoader';

export const metadata: Metadata = {
  title: 'Workspace — e-Mate AI',
  description:
    'Chat with e-Mate AI copilot, generate active recall study sets, and run RAG workflows.',
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

