-- RLS examples for `profiles` and `inquiries` tables
-- Apply after creating tables. Tailor to your existing functions/naming.

-- Enable Row Level Security
alter table public.profiles force row level security;
alter table public.inquiries force row level security;

-- Helper functions: resolve the current profile role through a security definer
create or replace function public.profile_role(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = target_user_id
  limit 1;
$$;

create or replace function public.is_profiles_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.profile_role(auth.uid()) = 'admin', false);
$$;

-- PROFILES
-- Allow users to insert their own profile record when auth.uid() matches
create policy "profiles_insert_own_buyer_or_admin" on public.profiles
  for insert
  with check (
    public.is_profiles_admin()
    or (
      auth.uid() = id
      and coalesce(role, 'buyer') = 'buyer'
    )
  );

-- Allow users to select their own profile or admins to select any
create policy "profiles_select_own_or_admin" on public.profiles
  for select
  using (auth.uid() = id OR public.is_profiles_admin());

-- Allow update only for admin or the owner, and prevent self-service role escalation
create policy "profiles_update_own_preserve_role_or_admin" on public.profiles
  for update
  using (auth.uid() = id OR public.is_profiles_admin())
  with check (
    public.is_profiles_admin()
    or (
      auth.uid() = id
      and role = public.profile_role(auth.uid())
    )
  );

create policy "profiles_delete_admin_only" on public.profiles
  for delete
  using (public.is_profiles_admin());

-- INQUIRIES
-- Allow anyone authenticated to insert an inquiry where user_id equals their uid
create policy "inquiries_insert_authenticated" on public.inquiries
  for insert
  with check (auth.uid() = user_id);

-- Allow buyers to select only their own inquiries; allow admins to select all
create policy "inquiries_select_owner_or_admin" on public.inquiries
  for select
  using (auth.uid() = user_id OR public.is_profiles_admin());

-- Allow updates only for admins (e.g., to change status)
create policy "inquiries_update_admin_only" on public.inquiries
  for update
  using (public.is_profiles_admin())
  with check (public.is_profiles_admin());

-- Allow deletes only for admins
create policy "inquiries_delete_admin_only" on public.inquiries
  for delete
  using (public.is_profiles_admin());

-- Notes:
-- 1) These policies assume `profiles` will be populated with role values ('buyer' or 'admin').
-- 2) For security, prefer server-side Edge Functions for any privileged write operations rather than exposing direct DB writes from the browser.
