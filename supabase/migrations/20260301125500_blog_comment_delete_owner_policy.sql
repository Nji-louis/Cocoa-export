begin;

drop policy if exists "blog_comments_delete_staff" on public.blog_comments;
drop policy if exists "blog_comments_delete_owner_or_staff" on public.blog_comments;

create policy "blog_comments_delete_owner_or_staff"
on public.blog_comments
for delete
to authenticated
using (
  author_user_id = auth.uid()
  or public.is_staff_or_admin()
);

update public.blog_comments
set
  status = 'approved',
  approved_at = coalesce(approved_at, created_at)
where status = 'pending';

commit;
