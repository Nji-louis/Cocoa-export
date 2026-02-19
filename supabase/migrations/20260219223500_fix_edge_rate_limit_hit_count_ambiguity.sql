begin;

create or replace function public.consume_edge_rate_limit(
  p_function_name text,
  p_identifier_hash text,
  p_window_seconds integer,
  p_max_hits integer
)
returns table (
  allowed boolean,
  hit_count integer,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_hit_count integer;
  v_elapsed_seconds integer;
begin
  if p_function_name is null or btrim(p_function_name) = '' then
    raise exception 'p_function_name is required';
  end if;

  if p_identifier_hash is null or length(p_identifier_hash) != 64 then
    raise exception 'p_identifier_hash must be a 64-char SHA-256 hex value';
  end if;

  if p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'p_window_seconds must be greater than zero';
  end if;

  if p_max_hits is null or p_max_hits <= 0 then
    raise exception 'p_max_hits must be greater than zero';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.edge_rate_limits as erl (
    function_name,
    identifier_hash,
    window_seconds,
    window_start,
    hit_count
  )
  values (
    p_function_name,
    p_identifier_hash,
    p_window_seconds,
    v_window_start,
    1
  )
  on conflict (function_name, identifier_hash, window_seconds, window_start)
  do update set
    hit_count = erl.hit_count + 1,
    updated_at = now()
  returning erl.hit_count into v_hit_count;

  v_elapsed_seconds := greatest(floor(extract(epoch from (v_now - v_window_start)))::integer, 0);

  allowed := v_hit_count <= p_max_hits;
  hit_count := v_hit_count;
  remaining := greatest(p_max_hits - v_hit_count, 0);
  retry_after_seconds := greatest(p_window_seconds - v_elapsed_seconds, 1);
  return next;
end;
$$;

revoke all on function public.consume_edge_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_edge_rate_limit(text, text, integer, integer) to postgres;
grant execute on function public.consume_edge_rate_limit(text, text, integer, integer) to service_role;

commit;
