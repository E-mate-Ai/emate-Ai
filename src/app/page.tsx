'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import AITopperChatScreen from './ai-topper-chat/components/AITopperChatScreen';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function RootHomePage() {
  return (
    <AppLayout>
      <Suspense fallback={<SkeletonLoader />}>
        <AITopperChatScreen />
      </Suspense>
    </AppLayout>
  );
}
