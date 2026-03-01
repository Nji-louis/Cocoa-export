alter table if exists public.blog_comments
  add column if not exists author_avatar_url text;

-- Backfill from user profile avatars for existing comments where possible.
update public.blog_comments c
set author_avatar_url = up.avatar_url
from public.user_profiles up
where c.author_user_id = up.id
  and c.author_avatar_url is null
  and up.avatar_url is not null;
