begin;

create or replace function public.record_testimonial_vote(
  p_testimonial_id uuid,
  p_vote text
)
returns table (
  testimonial_id uuid,
  up_votes integer,
  down_votes integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vote text := lower(coalesce(p_vote, ''));
begin
  if p_testimonial_id is null then
    raise exception 'p_testimonial_id is required';
  end if;

  if v_vote not in ('up', 'down') then
    raise exception 'p_vote must be either up or down';
  end if;

  update public.buyer_testimonials bt
  set
    up_votes = bt.up_votes + case when v_vote = 'up' then 1 else 0 end,
    down_votes = bt.down_votes + case when v_vote = 'down' then 1 else 0 end,
    updated_at = now()
  where bt.id = p_testimonial_id
    and bt.status = 'published'
  returning bt.id, bt.up_votes, bt.down_votes
  into testimonial_id, up_votes, down_votes;

  if testimonial_id is null then
    raise exception 'Testimonial not found';
  end if;

  return next;
end;
$$;

revoke all on function public.record_testimonial_vote(uuid, text) from public;
grant execute on function public.record_testimonial_vote(uuid, text) to postgres;
grant execute on function public.record_testimonial_vote(uuid, text) to service_role;

commit;
