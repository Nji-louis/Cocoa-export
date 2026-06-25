-- AI Cocoa & Coffee News Automation
-- Extends the existing blog system only; generated content is always saved as draft.

alter table if exists public.blog_posts
  add column if not exists featured_image text,
  add column if not exists category text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists keywords text[] not null default '{}'::text[],
  add column if not exists source_country text,
  add column if not exists industry_type text,
  add column if not exists source_url text,
  add column if not exists source_title text,
  add column if not exists featured_image_prompt text,
  add column if not exists internal_linking_suggestions jsonb not null default '[]'::jsonb,
  add column if not exists ai_generated boolean not null default false,
  add column if not exists ai_generation_model text,
  add column if not exists ai_generation_sources jsonb not null default '[]'::jsonb,
  add column if not exists ai_similarity_score numeric(5,4);

do $$
begin
  alter table public.blog_posts
    add constraint blog_posts_industry_type_check
    check (industry_type is null or industry_type in ('cocoa', 'coffee'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.blog_posts
    add constraint blog_posts_ai_drafts_never_published_check
    check (ai_generated = false or status <> 'published' or published_at is not null);
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_blog_posts_ai_drafts
on public.blog_posts(ai_generated, status, created_at desc)
where ai_generated = true and status = 'draft';

create index if not exists idx_blog_posts_source_url
on public.blog_posts(source_url)
where source_url is not null;

create index if not exists idx_blog_posts_keywords_gin
on public.blog_posts using gin (keywords);

insert into public.blog_categories (slug, name, description)
values
  ('cocoa-beans', 'Cocoa Beans', 'Cocoa bean sourcing, quality, origin, and export intelligence.'),
  ('cocoa-powder', 'Cocoa Powder', 'Cocoa powder processing, supply, quality, and market guidance.'),
  ('cocoa-liquor', 'Cocoa Liquor', 'Cocoa liquor and semi-finished cocoa product insights.'),
  ('arabica-coffee', 'Arabica Coffee', 'Arabica coffee sourcing, quality, and export intelligence.'),
  ('robusta-coffee', 'Robusta Coffee', 'Robusta coffee sourcing, quality, and export intelligence.'),
  ('market-news', 'Market News', 'Cocoa and coffee market news for international buyers.'),
  ('export-guides', 'Export Guides', 'Practical import and export guidance for bulk buyers.'),
  ('industry-insights', 'Industry Insights', 'Industry analysis for cocoa, coffee, food, chocolate, and beverage manufacturers.')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

create table if not exists public.ai_blog_logs (
  id uuid primary key default gen_random_uuid(),
  execution_time timestamptz not null default now(),
  source text,
  article_title text,
  success boolean not null default false,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_blog_logs_execution_time
on public.ai_blog_logs(execution_time desc);

create index if not exists idx_ai_blog_logs_success
on public.ai_blog_logs(success, execution_time desc);

alter table public.ai_blog_logs enable row level security;

drop policy if exists ai_blog_logs_admin_read on public.ai_blog_logs;
create policy ai_blog_logs_admin_read
on public.ai_blog_logs
for select
to authenticated
using (public.is_staff_or_admin());

drop policy if exists ai_blog_logs_admin_manage on public.ai_blog_logs;
create policy ai_blog_logs_admin_manage
on public.ai_blog_logs
for all
to authenticated
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

grant select on public.ai_blog_logs to authenticated;
