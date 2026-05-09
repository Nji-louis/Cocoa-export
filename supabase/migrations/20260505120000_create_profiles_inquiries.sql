-- Migration: create profiles and inquiries tables
-- Run this in your Supabase SQL editor or as part of a migration

-- Enable uuid/os extensions if missing
create extension if not exists "pgcrypto";

-- Profiles table: one-to-one with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'buyer',
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_profiles_email on public.profiles(email);

-- Inquiries table
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  product text,
  quantity text,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_inquiries_user on public.inquiries(user_id);
create index if not exists idx_inquiries_created on public.inquiries(created_at desc);
