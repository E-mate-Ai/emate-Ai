-- ========================================================
-- DOCUMENT & CHUNK METADATA SCHEMA WITH PGVECTOR SUPPORT
-- e-Mate AI Ingestion & RAG Retrieval Foundation
-- ========================================================

-- 1. Enable pgvector extension for embedding storage in Phase 3
create extension if not exists vector;

-- 2. DOCUMENTS TABLE (Parent uploaded documents)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null, -- 'pdf' | 'docx' | 'txt' | 'md' | 'json' | 'csv' | 'other'
  mime_type text not null default 'application/octet-stream',
  file_size_bytes bigint not null default 0,
  total_characters integer not null default 0,
  total_words integer not null default 0,
  total_chunks integer not null default 0,
  subject text,
  storage_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_subject on public.documents(subject);

-- 3. DOCUMENT CHUNKS TABLE (Semantic chunks matching DocumentChunk / RetrievedChunk interface)
create table if not exists public.document_chunks (
  id text primary key, -- e.g. `${document_id}_chunk_${position_index}`
  document_id uuid references public.documents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  source text not null, -- Original file name (e.g. "OS_Unit2.pdf")
  page_or_section text, -- Formatted attribution label ("Section: Deadlocks" / "Page 14")
  text text not null, -- Clean chunk text content
  position_index integer not null, -- Chunk sequence order (1, 2, 3...)
  word_count integer not null default 0,
  character_count integer not null default 0,
  heading text,
  heading_level integer,
  page_number integer,
  metadata jsonb default '{}'::jsonb not null,
  -- 768-dimensional vector matching Google Gemini text-embedding-004 (Phase 3)
  embedding vector(768),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_document_chunks_document_id on public.document_chunks(document_id, position_index);
create index if not exists idx_document_chunks_user_id on public.document_chunks(user_id);
create index if not exists idx_document_chunks_source on public.document_chunks(source);

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

-- Documents RLS Policies
create policy "Users can select their own documents"
  on public.documents for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update their own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Document Chunks RLS Policies
create policy "Users can select chunks of their documents"
  on public.document_chunks for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert chunks of their documents"
  on public.document_chunks for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update chunks of their documents"
  on public.document_chunks for update
  using (auth.uid() = user_id);

create policy "Users can delete chunks of their documents"
  on public.document_chunks for delete
  using (auth.uid() = user_id);
