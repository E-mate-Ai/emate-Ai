import { createClient } from '@/lib/supabase/client';

export async function signInWithGoogle() {
  const supabase = createClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://emate-ai.runs-on.dev');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/ai-topper-chat`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Google sign in error:', error.message);
  }
}
