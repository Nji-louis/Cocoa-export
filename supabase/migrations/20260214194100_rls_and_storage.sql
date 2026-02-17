begin;

-- Enable RLS
alter table public.user_profiles enable row level security;

alter table public.user_role_assignments enable row level security;

alter table public.product_categories enable row level security;

alter table public.products enable row level security;

alter table public.product_specifications enable row level security;

alter table public.product_media_assets enable row level security;

alter table public.inventory_listings enable row level security;

alter table public.export_documents enable row level security;

alter table public.inquiry_requests enable row level security;

alter table public.inquiry_events enable row level security;

alter table public.workflow_tasks enable row level security;

alter table public.blog_categories enable row level security;

alter table public.blog_posts enable row level security;

alter table public.blog_comments enable row level security;

alter table public.buyer_testimonials enable row level security;

alter table public.newsletter_subscriptions enable row level security;

-- user_profiles
DROP POLICY IF EXISTS "user_profiles_select_own_or_staff" ON public.user_profiles;
create policy "user_profiles_select_own_or_staff"
on public.user_profiles
for select
to authenticated
using (id = auth.uid() or public.is_staff_or_admin());

DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
create policy "user_profiles_insert_own"
on public.user_profiles
for insert
to authenticated
with check (id = auth.uid() or public.is_staff_or_admin());

DROP POLICY IF EXISTS "user_profiles_update_own_or_staff" ON public.user_profiles;
create policy "user_profiles_update_own_or_staff"
on public.user_profiles
for update
to authenticated
using (id = auth.uid() or public.is_staff_or_admin())
with check (id = auth.uid() or public.is_staff_or_admin());

DROP POLICY IF EXISTS "user_profiles_delete_staff" ON public.user_profiles;
create policy "user_profiles_delete_staff"
on public.user_profiles
for delete
to authenticated
using (public.is_staff_or_admin());

-- user_role_assignments
DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_role_assignments;
create policy "user_roles_select_own_or_admin"
on public.user_role_assignments
for select
to authenticated
using (user_id = auth.uid() or public.has_role('admin'));

DROP POLICY IF EXISTS "user_roles_admin_write" ON public.user_role_assignments;
create policy "user_roles_admin_write"
on public.user_role_assignments
for all
to authenticated
using (public.has_role('admin'))
with check (public.has_role('admin'));

-- product_categories
DROP POLICY IF EXISTS "product_categories_public_read" ON public.product_categories;
create policy "product_categories_public_read"
on public.product_categories
for select
to anon, authenticated
using (status = 'published' or public.is_staff_or_admin());

DROP POLICY IF EXISTS "product_categories_staff_write" ON public.product_categories;
create policy "product_categories_staff_write"
on public.product_categories
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- products
DROP POLICY IF EXISTS "products_public_read" ON public.products;
create policy "products_public_read"
on public.products
for select
to anon, authenticated
using ((status = 'published' and deleted_at is null) or public.is_staff_or_admin());

DROP POLICY IF EXISTS "products_staff_write" ON public.products;
create policy "products_staff_write"
on public.products
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- product_specifications
DROP POLICY IF EXISTS "product_specifications_public_read" ON public.product_specifications;
create policy "product_specifications_public_read"
on public.product_specifications
for select
to anon, authenticated
using (
  public.is_staff_or_admin()
  or exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.status = 'published'
      and p.deleted_at is null
  )
);

DROP POLICY IF EXISTS "product_specifications_staff_write" ON public.product_specifications;
create policy "product_specifications_staff_write"
on public.product_specifications
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- product_media_assets
DROP POLICY IF EXISTS "product_media_public_read" ON public.product_media_assets;
create policy "product_media_public_read"
on public.product_media_assets
for select
to anon, authenticated
using (
  public.is_staff_or_admin()
  or (
    visibility = 'public'
    and exists (
      select 1
      from public.products p
      where p.id = product_id
        and p.status = 'published'
        and p.deleted_at is null
    )
  )
);

DROP POLICY IF EXISTS "product_media_staff_write" ON public.product_media_assets;
create policy "product_media_staff_write"
on public.product_media_assets
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- inventory_listings
DROP POLICY IF EXISTS "inventory_public_read" ON public.inventory_listings;
create policy "inventory_public_read"
on public.inventory_listings
for select
to anon, authenticated
using (
  public.is_staff_or_admin()
  or (
    status = 'active'
    and exists (
      select 1
      from public.products p
      where p.id = product_id
        and p.status = 'published'
        and p.deleted_at is null
    )
  )
);

DROP POLICY IF EXISTS "inventory_staff_write" ON public.inventory_listings;
create policy "inventory_staff_write"
on public.inventory_listings
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- export_documents
DROP POLICY IF EXISTS "export_documents_staff_read" ON public.export_documents;
create policy "export_documents_staff_read"
on public.export_documents
for select
to authenticated
using (public.is_staff_or_admin());

DROP POLICY IF EXISTS "export_documents_staff_write" ON public.export_documents;
create policy "export_documents_staff_write"
on public.export_documents
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- inquiry_requests
DROP POLICY IF EXISTS "inquiries_select_own_or_staff" ON public.inquiry_requests;
create policy "inquiries_select_own_or_staff"
on public.inquiry_requests
for select
to authenticated
using (submitted_by = auth.uid() or public.is_staff_or_admin());

DROP POLICY IF EXISTS "inquiries_insert_authenticated_own" ON public.inquiry_requests;
create policy "inquiries_insert_authenticated_own"
on public.inquiry_requests
for insert
to authenticated
with check (submitted_by = auth.uid() or public.is_staff_or_admin());

DROP POLICY IF EXISTS "inquiries_update_staff_only" ON public.inquiry_requests;
create policy "inquiries_update_staff_only"
on public.inquiry_requests
for update
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

DROP POLICY IF EXISTS "inquiries_delete_staff_only" ON public.inquiry_requests;
create policy "inquiries_delete_staff_only"
on public.inquiry_requests
for delete
to authenticated
using (public.is_staff_or_admin());

-- inquiry_events
DROP POLICY IF EXISTS "inquiry_events_staff_read" ON public.inquiry_events;
create policy "inquiry_events_staff_read"
on public.inquiry_events
for select
to authenticated
using (public.is_staff_or_admin());

DROP POLICY IF EXISTS "inquiry_events_staff_write" ON public.inquiry_events;
create policy "inquiry_events_staff_write"
on public.inquiry_events
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- workflow_tasks
DROP POLICY IF EXISTS "workflow_tasks_staff_read" ON public.workflow_tasks;
create policy "workflow_tasks_staff_read"
on public.workflow_tasks
for select
to authenticated
using (public.is_staff_or_admin());

DROP POLICY IF EXISTS "workflow_tasks_staff_write" ON public.workflow_tasks;
create policy "workflow_tasks_staff_write"
on public.workflow_tasks
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- blog_categories
DROP POLICY IF EXISTS "blog_categories_public_read" ON public.blog_categories;
create policy "blog_categories_public_read"
on public.blog_categories
for select
to anon, authenticated
using (true);

DROP POLICY IF EXISTS "blog_categories_staff_write" ON public.blog_categories;
create policy "blog_categories_staff_write"
on public.blog_categories
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- blog_posts
DROP POLICY IF EXISTS "blog_posts_public_read" ON public.blog_posts;
create policy "blog_posts_public_read"
on public.blog_posts
for select
to anon, authenticated
using (status = 'published' or public.is_staff_or_admin());

DROP POLICY IF EXISTS "blog_posts_staff_write" ON public.blog_posts;
create policy "blog_posts_staff_write"
on public.blog_posts
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- blog_comments
DROP POLICY IF EXISTS "blog_comments_public_read_approved" ON public.blog_comments;
create policy "blog_comments_public_read_approved"
on public.blog_comments
for select
to anon, authenticated
using (
  status = 'approved'
  or author_user_id = auth.uid()
  or public.is_staff_or_admin()
);

DROP POLICY IF EXISTS "blog_comments_insert_auth_users" ON public.blog_comments;
create policy "blog_comments_insert_auth_users"
on public.blog_comments
for insert
to authenticated
with check (
  (author_user_id = auth.uid() or public.is_staff_or_admin())
  and status in ('pending', 'approved')
);

DROP POLICY IF EXISTS "blog_comments_update_owner_or_staff" ON public.blog_comments;
create policy "blog_comments_update_owner_or_staff"
on public.blog_comments
for update
to authenticated
using (
  (author_user_id = auth.uid() and status = 'pending')
  or public.is_staff_or_admin()
)
with check (
  (author_user_id = auth.uid() and status = 'pending')
  or public.is_staff_or_admin()
);

DROP POLICY IF EXISTS "blog_comments_delete_staff" ON public.blog_comments;
create policy "blog_comments_delete_staff"
on public.blog_comments
for delete
to authenticated
using (public.is_staff_or_admin());

-- buyer_testimonials
DROP POLICY IF EXISTS "testimonials_public_read" ON public.buyer_testimonials;
create policy "testimonials_public_read"
on public.buyer_testimonials
for select
to anon, authenticated
using (status = 'published' or public.is_staff_or_admin());

DROP POLICY IF EXISTS "testimonials_staff_write" ON public.buyer_testimonials;
create policy "testimonials_staff_write"
on public.buyer_testimonials
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

-- newsletter_subscriptions
DROP POLICY IF EXISTS "newsletter_select_own_or_staff" ON public.newsletter_subscriptions;
create policy "newsletter_select_own_or_staff"
on public.newsletter_subscriptions
for select
to authenticated
using (
  public.is_staff_or_admin()
  or user_id = auth.uid()
  or lower(email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

DROP POLICY IF EXISTS "newsletter_insert_auth_own" ON public.newsletter_subscriptions;
create policy "newsletter_insert_auth_own"
on public.newsletter_subscriptions
for insert
to authenticated
with check (
  public.is_staff_or_admin()
  or user_id = auth.uid()
  or lower(email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

DROP POLICY IF EXISTS "newsletter_update_own_or_staff" ON public.newsletter_subscriptions;
create policy "newsletter_update_own_or_staff"
on public.newsletter_subscriptions
for update
to authenticated
using (
  public.is_staff_or_admin()
  or user_id = auth.uid()
  or lower(email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  public.is_staff_or_admin()
  or user_id = auth.uid()
  or lower(email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

DROP POLICY IF EXISTS "newsletter_delete_staff" ON public.newsletter_subscriptions;
create policy "newsletter_delete_staff"
on public.newsletter_subscriptions
for delete
to authenticated
using (public.is_staff_or_admin());

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'product-images',
    'product-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'blog-images',
    'blog-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'export-documents',
    'export-documents',
    false,
    26214400,
    array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
  ),
  (
    'inquiry-attachments',
    'inquiry-attachments',
    false,
    26214400,
    array['application/pdf', 'image/jpeg', 'image/png']::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare
  v_can_manage_storage_objects boolean := true;
begin
  begin
    execute 'alter table storage.objects enable row level security';
  exception
    when insufficient_privilege then
      v_can_manage_storage_objects := false;
      raise notice 'Skipping storage.objects RLS/policies: current role is not owner of storage.objects.';
    when undefined_table then
      v_can_manage_storage_objects := false;
      raise notice 'Skipping storage.objects RLS/policies: storage.objects table does not exist.';
  end;

  if v_can_manage_storage_objects then
    execute $sql$
      drop policy if exists "storage_public_read_images" on storage.objects;
    $sql$;
    execute $sql$
      create policy "storage_public_read_images"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id in ('product-images', 'blog-images'));
    $sql$;

    execute $sql$
      drop policy if exists "storage_staff_read_private" on storage.objects;
    $sql$;
    execute $sql$
      create policy "storage_staff_read_private"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id in ('export-documents', 'inquiry-attachments')
        and public.is_staff_or_admin()
      );
    $sql$;

    execute $sql$
      drop policy if exists "storage_staff_insert" on storage.objects;
    $sql$;
    execute $sql$
      create policy "storage_staff_insert"
      on storage.objects
      for insert
      to authenticated
      with check (
        public.is_staff_or_admin()
        and bucket_id in ('product-images', 'blog-images', 'export-documents', 'inquiry-attachments')
      );
    $sql$;

    execute $sql$
      drop policy if exists "storage_staff_update" on storage.objects;
    $sql$;
    execute $sql$
      create policy "storage_staff_update"
      on storage.objects
      for update
      to authenticated
      using (public.is_staff_or_admin())
      with check (public.is_staff_or_admin());
    $sql$;

    execute $sql$
      drop policy if exists "storage_staff_delete" on storage.objects;
    $sql$;
    execute $sql$
      create policy "storage_staff_delete"
      on storage.objects
      for delete
      to authenticated
      using (public.is_staff_or_admin());
    $sql$;
  end if;
end $$;

commit;
