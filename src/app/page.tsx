'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthScreen from './sign-up-login-screen/components/AuthScreen';
import { createClient } from '@/lib/supabase/client';

import SkeletonLoader from '@/components/SkeletonLoader';

export default function RootHomePage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shouldShowAuth, setShouldShowAuth] = useState(false);

  useEffect(() => {
    async function checkAuthAndRedirect() {
      if (typeof window === 'undefined') return;

      // 1. Check client-side storage & cookies for existing session signals
      const hasOpenRouterKey =
        !!localStorage.getItem('user_openrouter_key') ||
        document.cookie.includes('user_openrouter_key');

      const isGuestSession =
        !!localStorage.getItem('guest_session') ||
        document.cookie.includes('is_guest_user=true') ||
        document.cookie.includes('guest_mode=true');

      if (hasOpenRouterKey || isGuestSession) {
        // User already signed up / connected or selected guest session -> go straight to chat
        router.replace('/ai-topper-chat');
        return;
      }

      // 2. Check Supabase session
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Existing authenticated user -> redirect to chat workspace
          router.replace('/ai-topper-chat');
          return;
        }
      } catch (err) {
        console.error('Error checking auth session:', err);
      }

      // 3. Brand new user -> show Login / Sign Up interface directly on homepage
      setShouldShowAuth(true);
      setIsCheckingAuth(false);
    }

    checkAuthAndRedirect();
  }, [router]);

  if (isCheckingAuth) {
    return <SkeletonLoader />;
  }

  if (shouldShowAuth) {
    return <AuthScreen />;
  }

  return null;
}
