"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { mergeRemoteHistory, clearChatHistory } from "@/lib/chatHistory";
import { mergeRemoteNotebooks, mergeRemoteSubjects } from "@/lib/notebook";

/**
 * AuthListener — global component that reacts to Supabase auth events.
 *
 * On SIGNED_IN / TOKEN_REFRESHED:
 *   1. Fetches the user's full cloud chat history and notebooks from
 *      `/api/user/history` and `/api/user/notebooks` (server-authenticated).
 *   2. Merges the results into the local optimistic caches (localStorage).
 *   3. Dispatches change events so the Sidebar, ChatMainArea, and all other
 *      listening components re-render with the cloud data.
 *
 * On SIGNED_OUT:
 *   Clears the local caches so the next sign-in starts clean.
 */
export function AuthListener() {
  const supabase = createClient();

  useEffect(() => {
    // 1. Sync active session on initial page open
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log("[AuthListener] Active session restored for:", session.user.email);
        // Hydrate data from the cloud on initial load
        hydrateFromCloud();
      }
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log("[AuthListener] Session active:", session?.user?.email);
        hydrateFromCloud();
      }

      if (event === "SIGNED_OUT") {
        console.log("[AuthListener] User signed out — clearing local caches.");
        clearChatHistory();
        // Clear notebook and subject caches
        if (typeof window !== "undefined") {
          try {
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith("nk-notebook-") || key === "nk-custom-subjects") {
                localStorage.removeItem(key);
              }
            });
          } catch {}
          window.dispatchEvent(new Event("nk-subjects-changed"));
          window.dispatchEvent(new CustomEvent("nk-notebook-change", { detail: { bulk: true } }));
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}

// ─── Cloud hydration logic ────────────────────────────────────────────────────

async function hydrateFromCloud() {
  try {
    const [historyRes, notebooksRes] = await Promise.all([
      fetch("/api/user/history", { credentials: "include" }),
      fetch("/api/user/notebooks", { credentials: "include" }),
    ]);

    // Hydrate chat sessions
    if (historyRes.ok) {
      const { sessions } = await historyRes.json();
      if (sessions && sessions.length > 0) {
        mergeRemoteHistory(sessions);
      }
    } else {
      console.warn("[AuthListener] Failed to fetch chat history:", historyRes.status);
    }

    // Hydrate notebooks and subjects
    if (notebooksRes.ok) {
      const { notebooks, subjects } = await notebooksRes.json();

      if (subjects && subjects.length > 0) {
        mergeRemoteSubjects(subjects);
      }

      if (notebooks && notebooks.length > 0) {
        mergeRemoteNotebooks(notebooks);
      }
    } else {
      console.warn("[AuthListener] Failed to fetch notebooks:", notebooksRes.status);
    }

    console.log("[AuthListener] Cloud hydration complete.");
  } catch (err) {
    console.error("[AuthListener] Error hydrating data from cloud:", err);
  }
}
