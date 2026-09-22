-- ========================================================
-- ADD SUMMARY COLUMN TO DOCUMENTS TABLE FOR SUMMARIZE-THEN-RETRIEVE
-- ========================================================

alter table if exists public.documents 
  add column if not exists summary text,
  add column if not exists section_summaries jsonb default '{}'::jsonb;
