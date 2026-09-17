"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthListener() {
  const supabase = createClient();

  useEffect(() => {
    // 1. Sync active session on initial page open
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Session successfully recovered from local storage/cookies
        console.log("Active session restored for:", session.user.email);
      }
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log("Session active:", session?.user?.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}
