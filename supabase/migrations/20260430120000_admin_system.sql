begin;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('buyer', 'staff', 'admin');
  END IF;
END $$;

alter type public.app_role add value if not exists 'super_admin';
alter type public.app_role add value if not exists 'editor';

commit;

begin;

create extension if not exists pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('buyer', 'staff', 'admin', 'super_admin', 'editor');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_level') THEN
    CREATE TYPE public.visibility_level AS ENUM ('public', 'private');
  END IF;
END $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  phone_whatsapp text,
  country_region text,
  avatar_url text,
  default_role public.app_role not null default 'buyer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists idx_user_role_assignments_user_id on public.user_role_assignments(user_id);
create index if not exists idx_user_role_assignments_role on public.user_role_assignments(role);

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at before update on public.user_profiles
for each row execute function public.set_updated_at();

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.user_role_assignments ura
      where ura.user_id = auth.uid()
        and ura.role = required_role
    )
    or exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
        and up.default_role = required_role
    );
$$;

grant execute on function public.has_role(public.app_role) to anon, authenticated;

create table if not exists public.admin_accounts (

  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  title text,
  notes text,
  last_login_at timestamptz,
  invited_by uuid references auth.users(id) on delete set null,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = lower(slug)),
  label text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.app_role not null,
  permission_id uuid not null references public.admin_permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (role, permission_id)
);

create table if not exists public.website_content (
  id uuid primary key default gen_random_uuid(),
  page_key text not null check (page_key = lower(page_key)),
  section_key text not null check (section_key = lower(section_key)),
  title text,
  subtitle text,
  body text,
  content jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  seo_keywords text[] not null default '{}'::text[],
  contact_email text,
  contact_phone text,
  address_line text,
  is_published boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_key, section_key)
);

create table if not exists public.media_files (
  id uuid primary key default gen_random_uuid(),
  bucket_name text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size_bytes bigint,
  alt_text text,
  entity_type text,
  entity_id uuid,
  visibility public.visibility_level not null default 'public',
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_name, storage_path)
);

create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_accounts_status on public.admin_accounts(status);
create index if not exists idx_admin_role_permissions_role on public.admin_role_permissions(role);
create index if not exists idx_website_content_page_section on public.website_content(page_key, section_key);
create index if not exists idx_media_files_entity on public.media_files(entity_type, entity_id);
create index if not exists idx_admin_activity_log_actor_created on public.admin_activity_log(actor_user_id, created_at desc);

drop trigger if exists trg_admin_accounts_updated_at on public.admin_accounts;
create trigger trg_admin_accounts_updated_at before update on public.admin_accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_website_content_updated_at on public.website_content;
create trigger trg_website_content_updated_at before update on public.website_content
for each row execute function public.set_updated_at();

drop trigger if exists trg_media_files_updated_at on public.media_files;
create trigger trg_media_files_updated_at before update on public.media_files
for each row execute function public.set_updated_at();

create or replace function public.role_priority(role_value public.app_role)
returns integer
language sql
immutable
as $$
  select case role_value
    when 'super_admin' then 400
    when 'admin' then 300
    when 'editor' then 200
    when 'staff' then 100
    else 0
  end;
$$;

create or replace function public.get_primary_role(target_user_id uuid default auth.uid())
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  with roles as (
    select up.default_role as role
    from public.user_profiles up
    where up.id = target_user_id
    union
    select ura.role
    from public.user_role_assignments ura
    where ura.user_id = target_user_id
  )
  select coalesce(
    (
      select role
      from roles
      order by public.role_priority(role) desc
      limit 1
    ),
    'buyer'::public.app_role
  );
$$;

grant execute on function public.get_primary_role(uuid) to anon, authenticated;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('staff')
    or public.has_role('editor')
    or public.has_role('admin')
    or public.has_role('super_admin');
$$;

grant execute on function public.is_staff_or_admin() to anon, authenticated;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('staff')
    or public.has_role('editor')
    or public.has_role('admin')
    or public.has_role('super_admin');
$$;

grant execute on function public.is_admin_user() to anon, authenticated;

create or replace function public.is_manager_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin') or public.has_role('super_admin');
$$;

grant execute on function public.is_manager_user() to anon, authenticated;

create or replace function public.admin_has_permission(permission_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_role_assignments ura
    join public.admin_role_permissions arp on arp.role = ura.role
    join public.admin_permissions ap on ap.id = arp.permission_id
    where ura.user_id = auth.uid()
      and ap.slug = lower(permission_slug)
  )
  or exists (
    select 1
    from public.user_profiles up
    join public.admin_role_permissions arp on arp.role = up.default_role
    join public.admin_permissions ap on ap.id = arp.permission_id
    where up.id = auth.uid()
      and ap.slug = lower(permission_slug)
  );
$$;

grant execute on function public.admin_has_permission(text) to authenticated;

create or replace function public.can_manage_target_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.has_role('super_admin') then true
    when public.has_role('admin') then public.get_primary_role(target_user_id) <> 'super_admin'
    else auth.uid() = target_user_id
  end;
$$;

grant execute on function public.can_manage_target_user(uuid) to authenticated;

insert into public.admin_permissions (slug, label, description)
values
  ('dashboard.view', 'Dashboard View', 'View dashboard analytics and recent activity.'),
  ('products.manage', 'Manage Products', 'Create, update, archive products and categories.'),
  ('inquiries.manage', 'Manage Inquiries', 'View, export, reply to, and archive inquiries.'),
  ('content.edit', 'Edit Content', 'Edit homepage sections, SEO metadata, and shared website copy.'),
  ('media.manage', 'Manage Media', 'Upload, replace, and delete storage-backed media files.'),
  ('users.manage', 'Manage Admin Users', 'Invite, suspend, reset, and remove dashboard users.'),
  ('settings.manage', 'Manage Settings', 'Change dashboard settings and permission mappings.')
on conflict (slug) do update
set label = excluded.label,
    description = excluded.description;

insert into public.admin_role_permissions (role, permission_id)
select seed.role, ap.id
from public.admin_permissions ap
join (
  values
    ('super_admin'::public.app_role, 'dashboard.view'),
    ('super_admin'::public.app_role, 'products.manage'),
    ('super_admin'::public.app_role, 'inquiries.manage'),
    ('super_admin'::public.app_role, 'content.edit'),
    ('super_admin'::public.app_role, 'media.manage'),
    ('super_admin'::public.app_role, 'users.manage'),
    ('super_admin'::public.app_role, 'settings.manage'),
    ('admin'::public.app_role, 'dashboard.view'),
    ('admin'::public.app_role, 'products.manage'),
    ('admin'::public.app_role, 'inquiries.manage'),
    ('admin'::public.app_role, 'content.edit'),
    ('admin'::public.app_role, 'media.manage'),
    ('editor'::public.app_role, 'dashboard.view'),
    ('editor'::public.app_role, 'content.edit'),
    ('staff'::public.app_role, 'dashboard.view'),
    ('staff'::public.app_role, 'inquiries.manage')
) as seed(role, permission_slug) on seed.permission_slug = ap.slug
on conflict (role, permission_id) do nothing;

insert into public.website_content (
  page_key,
  section_key,
  title,
  subtitle,
  body,
  content,
  seo_title,
  seo_description,
  seo_keywords
)
values
  ('home', 'hero', 'Cameroon Cocoa Export Supply', 'Premium cocoa beans and cocoa products ready for export.', 'Manage this hero section from the dashboard.', '{"cta_label":"Request Quote","cta_href":"contact.html","badge":"Export-ready lots"}'::jsonb, 'Cameroon Cocoa Export Supply | CAMCOCOA', 'Premium cocoa exports from Cameroon managed through CAMCOCOA.', array['cameroon cocoa export','cocoa beans supplier','bulk cocoa export']),
  ('home', 'about', 'Trusted cocoa export operations', 'Structured sourcing, quality review, and shipment preparation.', 'This record can be connected to the public homepage about section.', '{}'::jsonb, null, null, '{}'::text[]),
  ('home', 'services', 'Export services', 'Origin sourcing, quality control, documentation, and logistics.', 'Use the dashboard to keep service copy aligned with operations.', '{}'::jsonb, null, null, '{}'::text[]),
  ('global', 'contact', 'Contact CAMCOCOA', 'Douala, Cameroon', 'Contact information shared across the website footer and contact panels.', '{"whatsapp":"+237 000 000 000","address":"Douala, Cameroon"}'::jsonb, null, null, '{}'::text[]),
  ('global', 'footer', 'CAMCOCOA', 'Cocoa export management', 'Footer copy controlled from the dashboard.', '{"copyright":"CAMCOCOA S.A.R.L Ltd"}'::jsonb, null, null, '{}'::text[])
on conflict (page_key, section_key) do nothing;

alter table public.admin_accounts enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.website_content enable row level security;
alter table public.media_files enable row level security;
alter table public.admin_activity_log enable row level security;

drop policy if exists admin_accounts_select on public.admin_accounts;
create policy admin_accounts_select on public.admin_accounts
for select to authenticated
using (public.is_admin_user() or auth.uid() = user_id);

drop policy if exists admin_accounts_self_update on public.admin_accounts;
create policy admin_accounts_self_update on public.admin_accounts
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists admin_permissions_select on public.admin_permissions;
create policy admin_permissions_select on public.admin_permissions
for select to authenticated
using (public.is_admin_user());

drop policy if exists admin_role_permissions_select on public.admin_role_permissions;
create policy admin_role_permissions_select on public.admin_role_permissions
for select to authenticated
using (public.is_admin_user());

drop policy if exists website_content_public_read on public.website_content;
create policy website_content_public_read on public.website_content
for select to anon, authenticated
using (is_published or public.is_admin_user());

drop policy if exists website_content_manage on public.website_content;
create policy website_content_manage on public.website_content
for all to authenticated
using (public.admin_has_permission('content.edit'))
with check (public.admin_has_permission('content.edit'));

drop policy if exists media_files_public_read on public.media_files;
create policy media_files_public_read on public.media_files
for select to anon, authenticated
using (visibility = 'public' or public.admin_has_permission('media.manage'));

drop policy if exists media_files_manage on public.media_files;
create policy media_files_manage on public.media_files
for all to authenticated
using (public.admin_has_permission('media.manage'))
with check (public.admin_has_permission('media.manage'));

drop policy if exists admin_activity_log_select on public.admin_activity_log;
create policy admin_activity_log_select on public.admin_activity_log
for select to authenticated
using (public.is_admin_user());

commit;
