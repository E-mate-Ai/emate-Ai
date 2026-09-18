-- ========================================================
-- SEARCH INDEXES & EXPLICIT ROLE GRANTS
-- ========================================================
-- Ensures the authenticated role can access all cloud-synced
-- tables via the Supabase Data API, and adds indexes for
-- the most common query patterns.

-- Trigram extension for text search
create extension if not exists pg_trgm;

-- GIN trigram index on chat_sessions.title for faster text search
create index if not exists idx_chat_sessions_title_trgm
  on public.chat_sessions using gin (title gin_trgm_ops);

-- Composite index on user_notebooks for sorted-by-updated queries
create index if not exists idx_user_notebooks_user_updated
  on public.user_notebooks (user_id, updated_at desc);

-- Composite index on chat_transcripts for user-scoped lookups
create index if not exists idx_chat_transcripts_user_updated
  on public.chat_transcripts (user_id, updated_at desc);

-- ── Explicit GRANT for authenticated role ────────────────────────────────
-- Per Supabase Data API docs: tables must have explicit role grants
-- to be accessible via the REST API. RLS policies (already in place)
-- control *which rows* are visible.

grant select, insert, update, delete on public.user_subjects    to authenticated;
grant select, insert, update, delete on public.user_notebooks   to authenticated;
grant select, insert, update, delete on public.chat_sessions    to authenticated;
grant select, insert, update, delete on public.chat_transcripts to authenticated;
grant select, insert, update, delete on public.user_sessions    to authenticated;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
