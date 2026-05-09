begin;

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

grant execute on function public.profile_role(uuid) to anon, authenticated;
grant execute on function public.is_profiles_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.inquiries enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
using (auth.uid() = id or public.is_profiles_admin());

drop policy if exists profiles_insert_own_buyer_or_admin on public.profiles;
create policy profiles_insert_own_buyer_or_admin
on public.profiles
for insert
with check (
  public.is_profiles_admin()
  or (
    auth.uid() = id
    and coalesce(role, 'buyer') = 'buyer'
  )
);

drop policy if exists profiles_update_own_preserve_role_or_admin on public.profiles;
create policy profiles_update_own_preserve_role_or_admin
on public.profiles
for update
using (auth.uid() = id or public.is_profiles_admin())
with check (
  public.is_profiles_admin()
  or (
    auth.uid() = id
    and role = public.profile_role(auth.uid())
  )
);

drop policy if exists profiles_delete_admin_only on public.profiles;
create policy profiles_delete_admin_only
on public.profiles
for delete
using (public.is_profiles_admin());

drop policy if exists inquiries_insert_authenticated on public.inquiries;
create policy inquiries_insert_authenticated
on public.inquiries
for insert
with check (auth.uid() = user_id);

drop policy if exists inquiries_select_owner_or_admin on public.inquiries;
create policy inquiries_select_owner_or_admin
on public.inquiries
for select
using (auth.uid() = user_id or public.is_profiles_admin());

drop policy if exists inquiries_update_admin_only on public.inquiries;
create policy inquiries_update_admin_only
on public.inquiries
for update
using (public.is_profiles_admin())
with check (public.is_profiles_admin());

drop policy if exists inquiries_delete_admin_only on public.inquiries;
create policy inquiries_delete_admin_only
on public.inquiries
for delete
using (public.is_profiles_admin());

commit;
