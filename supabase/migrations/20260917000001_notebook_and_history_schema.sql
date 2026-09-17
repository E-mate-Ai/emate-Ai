-- ========================================================
-- NOTEBOOK & CHAT HISTORY DATABASE SCHEMA FOR SUPABASE
-- ========================================================

-- 1. USER SUBJECTS TABLE (Stores custom subjects & units per user)
create table if not exists public.user_subjects (
  user_id uuid references auth.users(id) on delete cascade primary key,
  subjects jsonb default '[]'::jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USER NOTEBOOKS TABLE (Stores per-subject notes & notebook entries)
create table if not exists public.user_notebooks (
  id text primary key, -- e.g. `${user_id}-${subject_slug}`
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text not null,
  notebook_data jsonb default '{}'::jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_user_notebooks_user_id on public.user_notebooks(user_id);

-- 3. CHAT SESSIONS TABLE (Stores chat session metadata)
create table if not exists public.chat_sessions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  subject text,
  unit text,
  mode text default 'sprint',
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_chat_sessions_user_id on public.chat_sessions(user_id, timestamp desc);

-- 4. CHAT TRANSCRIPTS TABLE (Stores full conversation messages)
create table if not exists public.chat_transcripts (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  messages jsonb default '[]'::jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_chat_transcripts_user_id on public.chat_transcripts(user_id);

-- 5. USER SESSIONS TABLE (Tracking active browser sessions)
create table if not exists public.user_sessions (
  session_id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  is_guest boolean default true,
  user_agent text,
  last_active_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_user_sessions_user_id on public.user_sessions(user_id);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

alter table public.user_subjects enable row level security;
alter table public.user_notebooks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_transcripts enable row level security;
alter table public.user_sessions enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users can manage their own subjects" on public.user_subjects;
drop policy if exists "Users can manage their own notebooks" on public.user_notebooks;
drop policy if exists "Users can manage their own chat sessions" on public.chat_sessions;
drop policy if exists "Users can manage their own chat transcripts" on public.chat_transcripts;
drop policy if exists "Users can manage their own user_sessions" on public.user_sessions;

-- Policies for user_subjects
create policy "Users can manage their own subjects"
  on public.user_subjects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for user_notebooks
create policy "Users can manage their own notebooks"
  on public.user_notebooks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for chat_sessions
create policy "Users can manage their own chat sessions"
  on public.chat_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for chat_transcripts
create policy "Users can manage their own chat transcripts"
  on public.chat_transcripts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for user_sessions
create policy "Users can manage their own user_sessions"
  on public.user_sessions for all
  using (auth.uid() = user_id or auth.uid() is null)
  with check (auth.uid() = user_id or auth.uid() is null);

