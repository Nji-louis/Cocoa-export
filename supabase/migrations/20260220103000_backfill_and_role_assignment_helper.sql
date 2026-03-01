begin;

-- Backfill profile records for users that existed before trigger setup.
insert into public.user_profiles (id, full_name, default_role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  'buyer'::public.app_role
from auth.users u
left join public.user_profiles p on p.id = u.id
where p.id is null;

-- Ensure every user has at least a buyer role assignment.
insert into public.user_role_assignments (user_id, role)
select
  u.id,
  'buyer'::public.app_role
from auth.users u
left join public.user_role_assignments ura
  on ura.user_id = u.id
 and ura.role = 'buyer'::public.app_role
where ura.user_id is null;

-- Admin bootstrap/helper: run from SQL editor with a trusted operator account.
create or replace function public.set_user_role_by_email(
  p_email text,
  p_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if p_email is null or btrim(p_email) = '' then
    raise exception 'p_email is required';
  end if;

  select u.id
    into v_user_id
  from auth.users u
  where lower(u.email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    raise exception 'User with email % was not found', p_email;
  end if;

  insert into public.user_profiles (id, default_role)
  values (v_user_id, p_role)
  on conflict (id)
  do update set default_role = excluded.default_role;

  insert into public.user_role_assignments (user_id, role)
  values (v_user_id, p_role)
  on conflict (user_id, role) do nothing;
end;
$$;

revoke all on function public.set_user_role_by_email(text, public.app_role) from public;
grant execute on function public.set_user_role_by_email(text, public.app_role) to postgres;
grant execute on function public.set_user_role_by_email(text, public.app_role) to service_role;

commit;
