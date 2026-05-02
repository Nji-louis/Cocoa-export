create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    id,
    full_name,
    company_name,
    phone_whatsapp,
    country_region,
    default_role
  )
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    nullif(btrim(new.raw_user_meta_data ->> 'company_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'phone_whatsapp'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'country_region'), ''),
    'buyer'
  )
  on conflict (id) do update
  set
    full_name = coalesce(public.user_profiles.full_name, excluded.full_name),
    company_name = coalesce(public.user_profiles.company_name, excluded.company_name),
    phone_whatsapp = coalesce(public.user_profiles.phone_whatsapp, excluded.phone_whatsapp),
    country_region = coalesce(public.user_profiles.country_region, excluded.country_region),
    default_role = excluded.default_role;

  insert into public.user_role_assignments (user_id, role)
  values (new.id, 'buyer')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

update public.user_profiles as up
set
  full_name = coalesce(
    up.full_name,
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    split_part(u.email, '@', 1)
  ),
  company_name = coalesce(
    up.company_name,
    nullif(btrim(u.raw_user_meta_data ->> 'company_name'), '')
  ),
  phone_whatsapp = coalesce(
    up.phone_whatsapp,
    nullif(btrim(u.raw_user_meta_data ->> 'phone_whatsapp'), '')
  ),
  country_region = coalesce(
    up.country_region,
    nullif(btrim(u.raw_user_meta_data ->> 'country_region'), '')
  ),
  default_role = coalesce(up.default_role, 'buyer'::public.app_role)
from auth.users as u
where u.id = up.id;
