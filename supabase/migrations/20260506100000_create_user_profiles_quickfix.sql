-- Quick fix: create `user_profiles` table when missing
-- Run this in Supabase SQL editor or via psql with your DATABASE_URL

-- Ensure pgcrypto available
create extension if not exists pgcrypto;

-- helper to set updated_at if missing
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Minimal user_profiles table definition to satisfy server functions
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  phone_whatsapp text,
  country_region text,
  avatar_url text,
  default_role text not null default 'buyer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trigger to keep updated_at current
drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at before update on public.user_profiles
for each row execute function public.set_updated_at();

-- optional indexes
create index if not exists idx_user_profiles_default_role on public.user_profiles(default_role);
