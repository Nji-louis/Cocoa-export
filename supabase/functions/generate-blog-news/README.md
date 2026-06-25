# generate-blog-news

Creates AI-generated cocoa and coffee blog drafts for admin review. It never publishes articles automatically.

## What It Does

- Fetches cocoa and coffee industry RSS/news signals.
- Generates one original B2B export article per requested industry using OpenAI when `OPENAI_API_KEY` is present, with a deterministic fallback when it is not.
- Resolves a source-page cover image when available, stores the original news URL, and generates SEO title, meta description, keywords, excerpt, slug, category, image prompt, social posts, suggested tags, FAQ items, related-article suggestions, CTA copy, reading time, language, confidence score, and internal linking suggestions.
- Saves articles to `public.blog_posts` with `status = 'draft'`, `ai_generated = true`, and `published_at = null`.
- Logs successes and failures in `public.ai_blog_logs`.
- Prevents duplicates by checking existing titles, slugs, and content similarity before insert.

## Required Secrets

Set these in Supabase Edge Function secrets:

```bash
supabase secrets set AI_BLOG_CRON_SECRET="a-long-random-secret"
supabase secrets set SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
supabase secrets set SUPABASE_ANON_KEY="YOUR_ANON_KEY"
```

If you want OpenAI-powered generation, set:

```bash
supabase secrets set OPENAI_API_KEY="your_openai_api_key"
supabase secrets set OPENAI_MODEL="gpt-5.5"
```

## Configuration

The generator uses a content-profile configuration so new export products can be added by extending the profile map instead of rewriting the publishing logic. English is the default language today, and French can be added later by introducing another profile entry.

## Deploy

```bash
supabase db push
supabase functions deploy generate-blog-news
```

## Schedule

1. Open `supabase/scheduled-jobs/generate-blog-news.sql`.
2. Replace `YOUR_PROJECT_REF` and `REPLACE_WITH_AI_BLOG_CRON_SECRET`.
3. Run it in the Supabase SQL editor.

The included schedule is Monday, Wednesday, and Friday at 08:00 Africa/Douala (`0 7 * * 1,3,5` in UTC).

## Manual Test

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-blog-news" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_AI_BLOG_CRON_SECRET" \
  -d '{"industries":["cocoa","coffee"],"perIndustry":1}'
```

Then verify:

```sql
select title, category, status, ai_generated, created_at
from public.blog_posts
where ai_generated = true
order by created_at desc
limit 10;

select execution_time, source, article_title, success, error_message
from public.ai_blog_logs
order by execution_time desc
limit 20;
```
