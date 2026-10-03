-- ────────────────────────────────────────────────────────────────────────────
-- Fix: "Database error saving new user" on OAuth signup
-- Root cause: The handle_new_user() trigger fires on auth.users INSERT and
-- tries to INSERT into public.profiles.  If the profiles row already exists
-- (e.g. duplicate email, retried auth flow, or conflict on the unique email
-- column) it throws an unhandled exception which Supabase surfaces as
-- "Database error saving new user".
--
-- The fix:
--   1. Use ON CONFLICT (id) DO UPDATE so retries are always safe.
--   2. Wrap in a BEGIN/EXCEPTION block to swallow any remaining errors
--      and let the auth.users insert succeed regardless.
--   3. Ensure the trigger is correctly attached (idempotent).
-- ────────────────────────────────────────────────────────────────────────────

-- Make sure the profiles table exists (safety net for fresh databases)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  is_pro boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS must be enabled
alter table public.profiles enable row level security;

-- Policy: users can read/update their own profile
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'profiles'
      and policyname = 'Users can view and update their own profile'
  ) then
    create policy "Users can view and update their own profile"
      on public.profiles for all
      using ((select auth.uid()) = id);
  end if;
end $$;

-- ── Repaired trigger function ────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do update
    set
      email      = excluded.email,
      full_name  = coalesce(excluded.full_name, public.profiles.full_name),
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
      updated_at = now();

  return new;
exception when others then
  -- Log the error but never block the auth.users INSERT
  raise warning '[handle_new_user] profile upsert failed for user %: %', new.id, sqlerrm;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ── Re-attach the trigger (idempotent) ──────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
