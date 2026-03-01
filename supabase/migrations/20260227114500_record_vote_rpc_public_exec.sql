begin;

revoke all on function public.record_testimonial_vote(uuid, text) from public;
grant execute on function public.record_testimonial_vote(uuid, text) to postgres;
grant execute on function public.record_testimonial_vote(uuid, text) to service_role;
grant execute on function public.record_testimonial_vote(uuid, text) to anon;
grant execute on function public.record_testimonial_vote(uuid, text) to authenticated;

commit;
