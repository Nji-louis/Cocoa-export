begin;

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('buyer', 'staff', 'admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
    CREATE TYPE public.product_status AS ENUM ('draft', 'published', 'archived');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE public.listing_status AS ENUM ('draft', 'active', 'paused', 'closed', 'archived');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_status') THEN
    CREATE TYPE public.inquiry_status AS ENUM ('new', 'triaged', 'quoted', 'negotiating', 'contracted', 'closed_won', 'closed_lost', 'archived');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_priority') THEN
    CREATE TYPE public.inquiry_priority AS ENUM ('low', 'normal', 'high', 'urgent');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_status') THEN
    CREATE TYPE public.workflow_status AS ENUM ('todo', 'in_progress', 'blocked', 'completed', 'cancelled');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
    CREATE TYPE public.post_status AS ENUM ('draft', 'published', 'archived');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comment_status') THEN
    CREATE TYPE public.comment_status AS ENUM ('pending', 'approved', 'rejected', 'spam');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'unsubscribed', 'bounced');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
    CREATE TYPE public.media_type AS ENUM ('image', 'document');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_level') THEN
    CREATE TYPE public.visibility_level AS ENUM ('public', 'private');
  END IF;
END $$;

-- Shared triggers/helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auth/roles
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

-- Catalog
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = lower(slug)),
  name text not null unique,
  description text,
  display_order integer not null default 0,
  status public.product_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_categories_status_display on public.product_categories(status, display_order);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.product_categories(id) on delete set null,
  slug text not null unique check (slug = lower(slug)),
  name text not null,
  short_description text,
  description text,
  origin_country text not null default 'Cameroon',
  flavor_notes text[] not null default '{}',
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  is_new_arrival boolean not null default false,
  status public.product_status not null default 'published',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category_status on public.products(category_id, status);
create index if not exists idx_products_status_published on public.products(status, published_at desc);
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);

create table if not exists public.product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  spec_key text not null,
  spec_value text not null,
  unit text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_product_specifications_key_order
  on public.product_specifications(product_id, spec_key, sort_order);
create index if not exists idx_product_specifications_product_sort
  on public.product_specifications(product_id, sort_order);

create table if not exists public.product_media_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  bucket_name text,
  storage_path text,
  external_url text,
  alt_text text,
  media_type public.media_type not null default 'image',
  visibility public.visibility_level not null default 'public',
  is_primary boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (storage_path is not null or external_url is not null)
);

create index if not exists idx_product_media_assets_product_sort
  on public.product_media_assets(product_id, display_order);
create index if not exists idx_product_media_assets_bucket_path
  on public.product_media_assets(bucket_name, storage_path);

create table if not exists public.inventory_listings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  listing_code text not null unique,
  available_quantity_mt numeric(12,3),
  minimum_order_mt numeric(12,3),
  price_usd_per_mt numeric(12,2),
  currency char(3) not null default 'USD',
  incoterm text,
  origin_port text,
  destination_region text,
  harvest_season text,
  status public.listing_status not null default 'active',
  valid_until date,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (available_quantity_mt is null or available_quantity_mt >= 0),
  check (minimum_order_mt is null or minimum_order_mt >= 0),
  check (price_usd_per_mt is null or price_usd_per_mt >= 0)
);

create index if not exists idx_inventory_listings_product_status on public.inventory_listings(product_id, status);
create index if not exists idx_inventory_listings_status_valid_until on public.inventory_listings(status, valid_until);

create table if not exists public.export_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  listing_id uuid references public.inventory_listings(id) on delete set null,
  document_type text not null,
  bucket_name text not null default 'export-documents',
  storage_path text not null,
  is_public boolean not null default false,
  version integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_name, storage_path)
);

create index if not exists idx_export_documents_listing_type on public.export_documents(listing_id, document_type);
create index if not exists idx_export_documents_product_type on public.export_documents(product_id, document_type);

-- Inquiries/workflow
create table if not exists public.inquiry_requests (
  id uuid primary key default gen_random_uuid(),
  request_number bigint generated always as identity unique,
  submitted_by uuid references auth.users(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  listing_id uuid references public.inventory_listings(id) on delete set null,
  source_channel text not null default 'unknown',
  inquiry_topic text,
  company_name text not null,
  contact_name text,
  work_email citext not null,
  phone_whatsapp text,
  country_region text,
  required_volume_mt numeric(12,3),
  destination_port text,
  preferred_incoterm text,
  quality_specs text,
  message text,
  status public.inquiry_status not null default 'new',
  priority public.inquiry_priority not null default 'normal',
  assigned_to uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (required_volume_mt is null or required_volume_mt >= 0)
);

create index if not exists idx_inquiry_requests_status_created on public.inquiry_requests(status, created_at desc);
create index if not exists idx_inquiry_requests_submitted_by on public.inquiry_requests(submitted_by, created_at desc);
create index if not exists idx_inquiry_requests_work_email on public.inquiry_requests(work_email);
create index if not exists idx_inquiry_requests_product on public.inquiry_requests(product_id, status);

create table if not exists public.inquiry_events (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiry_requests(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status public.inquiry_status,
  to_status public.inquiry_status,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_inquiry_events_inquiry_created on public.inquiry_events(inquiry_id, created_at desc);
create index if not exists idx_inquiry_events_actor on public.inquiry_events(actor_user_id);

create table if not exists public.workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiry_requests(id) on delete cascade,
  title text not null,
  description text,
  status public.workflow_status not null default 'todo',
  assigned_to uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workflow_tasks_inquiry_status on public.workflow_tasks(inquiry_id, status);
create index if not exists idx_workflow_tasks_assigned_to on public.workflow_tasks(assigned_to, status);

-- Content
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = lower(slug)),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.blog_categories(id) on delete set null,
  slug text not null unique check (slug = lower(slug)),
  title text not null,
  excerpt text,
  content text,
  cover_bucket text,
  cover_path text,
  cover_external_url text,
  author_name text not null default 'Export Desk',
  status public.post_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cover_path is null or cover_external_url is null)
);

create index if not exists idx_blog_posts_status_published on public.blog_posts(status, published_at desc);
create index if not exists idx_blog_posts_category_status on public.blog_posts(category_id, status);
create index if not exists idx_blog_posts_title_trgm on public.blog_posts using gin (title gin_trgm_ops);

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  author_email citext,
  message text not null,
  status public.comment_status not null default 'pending',
  source_channel text not null default 'blog_detail',
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_comments_post_status on public.blog_comments(post_id, status, created_at desc);
create index if not exists idx_blog_comments_author_user on public.blog_comments(author_user_id);

create table if not exists public.buyer_testimonials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  author_name text not null,
  author_title text,
  author_company text,
  author_country text,
  message text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  up_votes integer not null default 0,
  down_votes integer not null default 0,
  status public.post_status not null default 'published',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_buyer_testimonials_product_status on public.buyer_testimonials(product_id, status, display_order);

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email citext not null unique,
  full_name text,
  source_channel text not null default 'unknown',
  status public.subscription_status not null default 'active',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_newsletter_subscriptions_status_created on public.newsletter_subscriptions(status, created_at desc);
create index if not exists idx_newsletter_subscriptions_user on public.newsletter_subscriptions(user_id);

-- Trigger wiring
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_product_categories_updated_at ON public.product_categories;
CREATE TRIGGER trg_product_categories_updated_at BEFORE UPDATE ON public.product_categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_product_specifications_updated_at ON public.product_specifications;
CREATE TRIGGER trg_product_specifications_updated_at BEFORE UPDATE ON public.product_specifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_product_media_assets_updated_at ON public.product_media_assets;
CREATE TRIGGER trg_product_media_assets_updated_at BEFORE UPDATE ON public.product_media_assets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_inventory_listings_updated_at ON public.inventory_listings;
CREATE TRIGGER trg_inventory_listings_updated_at BEFORE UPDATE ON public.inventory_listings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_export_documents_updated_at ON public.export_documents;
CREATE TRIGGER trg_export_documents_updated_at BEFORE UPDATE ON public.export_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_inquiry_requests_updated_at ON public.inquiry_requests;
CREATE TRIGGER trg_inquiry_requests_updated_at BEFORE UPDATE ON public.inquiry_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workflow_tasks_updated_at ON public.workflow_tasks;
CREATE TRIGGER trg_workflow_tasks_updated_at BEFORE UPDATE ON public.workflow_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_categories_updated_at ON public.blog_categories;
CREATE TRIGGER trg_blog_categories_updated_at BEFORE UPDATE ON public.blog_categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_comments_updated_at ON public.blog_comments;
CREATE TRIGGER trg_blog_comments_updated_at BEFORE UPDATE ON public.blog_comments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_buyer_testimonials_updated_at ON public.buyer_testimonials;
CREATE TRIGGER trg_buyer_testimonials_updated_at BEFORE UPDATE ON public.buyer_testimonials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_newsletter_subscriptions_updated_at ON public.newsletter_subscriptions;
CREATE TRIGGER trg_newsletter_subscriptions_updated_at BEFORE UPDATE ON public.newsletter_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auth/user bootstrap
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, default_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'buyer'
  )
  on conflict (id) do nothing;

  insert into public.user_role_assignments (user_id, role)
  values (new.id, 'buyer')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('staff') or public.has_role('admin');
$$;

grant execute on function public.is_staff_or_admin() to anon, authenticated;

create or replace function public.assign_user_role(target_user_id uuid, target_role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role('admin') then
    raise exception 'Only admins can assign roles';
  end if;

  insert into public.user_role_assignments (user_id, role, assigned_by)
  values (target_user_id, target_role, auth.uid())
  on conflict (user_id, role) do nothing;
end;
$$;

grant execute on function public.assign_user_role(uuid, public.app_role) to authenticated;

-- Read-optimized RPC for frontend listing/search
create or replace function public.search_catalog(
  p_query text default null,
  p_category_slug text default null,
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  product_id uuid,
  product_slug text,
  product_name text,
  category_slug text,
  short_description text,
  is_featured boolean,
  is_popular boolean,
  is_new_arrival boolean,
  available_quantity_mt numeric,
  price_usd_per_mt numeric,
  primary_image_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as product_id,
    p.slug as product_slug,
    p.name as product_name,
    c.slug as category_slug,
    p.short_description,
    p.is_featured,
    p.is_popular,
    p.is_new_arrival,
    l.available_quantity_mt,
    l.price_usd_per_mt,
    coalesce(m.external_url, case when m.storage_path is not null then m.bucket_name || '/' || m.storage_path end) as primary_image_url
  from public.products p
  left join public.product_categories c on c.id = p.category_id
  left join lateral (
    select l1.available_quantity_mt, l1.price_usd_per_mt
    from public.inventory_listings l1
    where l1.product_id = p.id
      and l1.status = 'active'
    order by l1.updated_at desc
    limit 1
  ) l on true
  left join lateral (
    select m1.bucket_name, m1.storage_path, m1.external_url
    from public.product_media_assets m1
    where m1.product_id = p.id
      and m1.media_type = 'image'
      and m1.visibility = 'public'
    order by m1.is_primary desc, m1.display_order asc
    limit 1
  ) m on true
  where p.status = 'published'
    and p.deleted_at is null
    and (p_query is null or p_query = ''
      or p.name ilike ('%' || p_query || '%')
      or coalesce(p.short_description, '') ilike ('%' || p_query || '%')
    )
    and (p_category_slug is null or p_category_slug = '' or c.slug = p_category_slug)
  order by p.is_featured desc, p.published_at desc nulls last, p.created_at desc
  limit greatest(p_limit, 1)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.search_catalog(text, text, integer, integer) to anon, authenticated;

create or replace function public.update_inquiry_status(
  p_inquiry_id uuid,
  p_to_status public.inquiry_status,
  p_note text default null
)
returns public.inquiry_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.inquiry_requests;
  v_from_status public.inquiry_status;
begin
  if not public.is_staff_or_admin() then
    raise exception 'Only staff/admin can update inquiry status';
  end if;

  select status into v_from_status
  from public.inquiry_requests
  where id = p_inquiry_id
  for update;

  if v_from_status is null then
    raise exception 'Inquiry not found';
  end if;

  update public.inquiry_requests
  set
    status = p_to_status,
    closed_at = case when p_to_status in ('closed_won', 'closed_lost', 'archived') then now() else null end,
    updated_at = now()
  where id = p_inquiry_id
  returning * into v_row;

  insert into public.inquiry_events (
    inquiry_id,
    actor_user_id,
    event_type,
    from_status,
    to_status,
    note
  )
  values (
    p_inquiry_id,
    auth.uid(),
    'status_change',
    v_from_status,
    p_to_status,
    p_note
  );

  return v_row;
end;
$$;

grant execute on function public.update_inquiry_status(uuid, public.inquiry_status, text) to authenticated;

commit;
