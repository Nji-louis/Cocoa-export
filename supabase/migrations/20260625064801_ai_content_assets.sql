-- AI Content Assistant publishing assets
-- Adds structured fields for richer AI-generated blog publishing bundles.

alter table if exists public.blog_posts
  add column if not exists social_facebook_post text,
  add column if not exists social_linkedin_post text,
  add column if not exists social_x_post text,
  add column if not exists social_instagram_caption text,
  add column if not exists suggested_tags text[] not null default '{}'::text[],
  add column if not exists related_articles jsonb not null default '[]'::jsonb,
  add column if not exists faq_items jsonb not null default '[]'::jsonb,
  add column if not exists cta_text text,
  add column if not exists confidence_score numeric(5,2),
  add column if not exists content_language text not null default 'en',
  add column if not exists reading_time_minutes integer,
  add column if not exists quality_check jsonb not null default '{}'::jsonb,
  add column if not exists publishing_assets jsonb not null default '{}'::jsonb;

do $$
begin
  alter table public.blog_posts
    add constraint blog_posts_confidence_score_check
    check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.blog_posts
    add constraint blog_posts_content_language_check
    check (content_language ~ '^[a-z]{2}(-[A-Z]{2})?$');
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_blog_posts_content_language
on public.blog_posts(content_language);

create index if not exists idx_blog_posts_confidence_score
on public.blog_posts(confidence_score desc);
