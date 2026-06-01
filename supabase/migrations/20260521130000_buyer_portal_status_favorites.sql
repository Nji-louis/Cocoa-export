begin;

alter table public.user_profiles
  add column if not exists buyer_status text not null default 'pending'
  check (buyer_status in ('pending', 'approved', 'disabled'));

create table if not exists public.buyer_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_buyer_favorites_user_created
  on public.buyer_favorites(user_id, created_at desc);

create index if not exists idx_buyer_favorites_product
  on public.buyer_favorites(product_id);

create or replace function public.user_profile_default_role(target_user_id uuid)
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select up.default_role
  from public.user_profiles up
  where up.id = target_user_id
  limit 1;
$$;

create or replace function public.user_profile_buyer_status(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select up.buyer_status
  from public.user_profiles up
  where up.id = target_user_id
  limit 1;
$$;

grant execute on function public.user_profile_default_role(uuid) to authenticated;
grant execute on function public.user_profile_buyer_status(uuid) to authenticated;

drop policy if exists "user_profiles_update_own_or_staff" on public.user_profiles;
create policy "user_profiles_update_own_or_staff"
on public.user_profiles
for update
to authenticated
using (id = auth.uid() or public.is_staff_or_admin())
with check (
  public.is_staff_or_admin()
  or (
    id = auth.uid()
    and default_role = public.user_profile_default_role(auth.uid())
    and buyer_status = public.user_profile_buyer_status(auth.uid())
  )
);

alter table public.buyer_favorites enable row level security;

drop policy if exists "buyer_favorites_select_own_or_staff" on public.buyer_favorites;
create policy "buyer_favorites_select_own_or_staff"
on public.buyer_favorites
for select
to authenticated
using (user_id = auth.uid() or public.is_staff_or_admin());

drop policy if exists "buyer_favorites_insert_own" on public.buyer_favorites;
create policy "buyer_favorites_insert_own"
on public.buyer_favorites
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "buyer_favorites_delete_own_or_staff" on public.buyer_favorites;
create policy "buyer_favorites_delete_own_or_staff"
on public.buyer_favorites
for delete
to authenticated
using (user_id = auth.uid() or public.is_staff_or_admin());

commit;
