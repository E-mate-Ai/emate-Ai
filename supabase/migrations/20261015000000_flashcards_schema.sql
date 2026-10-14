-- ========================================================
-- FLASHCARDS & VISUAL LEARNING SCHEMA FOR SUPABASE
-- ========================================================

-- 1. FLASHCARD DECKS TABLE (Stores AI-generated and custom study decks)
create table if not exists public.flashcard_decks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  topic text not null,
  subject text default 'General',
  difficulty text default 'intermediate' not null,
  learning_mode text default 'conceptual' not null,
  cards jsonb default '[]'::jsonb not null,
  card_count integer default 0 not null,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_flashcard_decks_user_id on public.flashcard_decks(user_id, updated_at desc);

-- 2. FLASHCARD PROGRESS & RECALL REVIEWS TABLE (Stores spaced repetition & recall ratings)
create table if not exists public.flashcard_deck_progress (
  id text primary key, -- user_id + ':' + deck_id
  user_id uuid references auth.users(id) on delete cascade not null,
  deck_id text references public.flashcard_decks(id) on delete cascade not null,
  card_ratings jsonb default '{}'::jsonb not null, -- cardId -> { rating, reviewedAt, count }
  bookmarked_card_ids jsonb default '[]'::jsonb not null,
  cards_studied integer default 0 not null,
  is_completed boolean default false not null,
  last_reviewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_flashcard_progress_user_id on public.flashcard_deck_progress(user_id);
create index if not exists idx_flashcard_progress_deck_id on public.flashcard_deck_progress(deck_id);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

alter table public.flashcard_decks enable row level security;
alter table public.flashcard_deck_progress enable row level security;

-- Policies for flashcard_decks
drop policy if exists "Users can manage their own flashcard decks" on public.flashcard_decks;
create policy "Users can manage their own flashcard decks"
  on public.flashcard_decks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for flashcard_deck_progress
drop policy if exists "Users can manage their own flashcard progress" on public.flashcard_deck_progress;
create policy "Users can manage their own flashcard progress"
  on public.flashcard_deck_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
