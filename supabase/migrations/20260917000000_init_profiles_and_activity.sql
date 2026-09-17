-- 1. USERS / PROFILES TABLE (Linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  avatar_url text,
  is_pro boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USER ACTIVITY TABLE (Tracking queries, model usage, notebook activity)
create table if not exists public.user_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  activity_type text not null, -- e.g. 'chat_query', 'notebook_create', 'quiz_generated'
  model_used text,              -- e.g. 'google/gemini-2.0-flash'
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.user_activity enable row level security;

-- 4. RLS POLICIES (Users can only read and write their own data)
drop policy if exists "Users can view and update their own profile" on public.profiles;
drop policy if exists "Users can view and log their own activity" on public.user_activity;

create policy "Users can view and update their own profile" 
  on public.profiles for all 
  using (auth.uid() = id);

create policy "Users can view and log their own activity" 
  on public.user_activity for all 
  using (auth.uid() = user_id);

-- 5. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution whenever a new user registers via Google or Email
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
