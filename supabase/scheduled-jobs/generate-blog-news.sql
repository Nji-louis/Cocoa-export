-- Supabase Scheduled Job: generate-blog-news
--
-- Run this after deploying the Edge Function and setting AI_BLOG_CRON_SECRET.
-- Replace the project URL and secret placeholder before executing in SQL editor.
--
-- Schedule: every 14 days at 08:00 Africa/Douala.
-- Supabase cron uses UTC, so this is 07:00 UTC because Douala is UTC+1.
-- Cron runs daily, and the SQL guard below only calls the Edge Function every
-- 14 days from 2026-06-29.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('generate-blog-news-mwf-0800')
where exists (
  select 1
  from cron.job
  where jobname = 'generate-blog-news-mwf-0800'
);

select cron.unschedule('generate-blog-news-biweekly-0800')
where exists (
  select 1
  from cron.job
  where jobname = 'generate-blog-news-biweekly-0800'
);

select cron.schedule(
  'generate-blog-news-biweekly-0800',
  '0 7 * * *',
  $$
  select
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-blog-news',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', 'REPLACE_WITH_AI_BLOG_CRON_SECRET'
      ),
      body := jsonb_build_object(
        'scheduled', true,
        'productFamilies', jsonb_build_array(
          'cocoa-beans',
          'amelonado-cocoa',
          'bresilien-cocoa',
          'cundeamor-cocoa',
          'forastero-cocoa',
          'criollo-cocoa',
          'trinitario-cocoa',
          'cocoa-butter',
          'cocoa-shell',
          'arabica-coffee',
          'robusta-coffee',
          'agricultural-export-services'
        )
      ),
      timeout_milliseconds := 30000
    )
  where mod((current_date - date '2026-06-29')::int, 14) = 0;
  $$
);
