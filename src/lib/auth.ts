import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle() {
  const supabase = createClient();
  const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4028');

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Directs Safari back to server callback route explicitly
      redirectTo: `${origin}/auth/callback?next=/ai-topper-chat`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) console.error("Google sign in error:", error.message);
}
