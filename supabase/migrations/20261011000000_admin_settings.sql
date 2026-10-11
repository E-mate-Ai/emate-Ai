create table if not exists public.admin_settings (
  setting_key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;

revoke all on table public.admin_settings from public, anon, authenticated;
grant select, insert, update, delete on table public.admin_settings to service_role;
