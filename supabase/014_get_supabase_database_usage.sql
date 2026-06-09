create or replace function public.get_supabase_database_usage()
returns table (
  database_size_bytes bigint,
  database_size_mb numeric,
  database_limit_mb numeric,
  usage_percent numeric
)
language plpgsql
stable
set search_path = pg_catalog, public, app_private
as $$
declare
  size_bytes bigint;
  free_plan_limit_mb numeric := 500;
begin
  if not app_private.is_role(array['superadmin']) then
    raise exception 'No autorizado para consultar el uso de Supabase.'
      using errcode = '42501';
  end if;

  size_bytes := pg_database_size(current_database());

  return query
  select
    size_bytes,
    round(size_bytes::numeric / 1024 / 1024, 2),
    free_plan_limit_mb,
    round(((size_bytes::numeric / 1024 / 1024) / free_plan_limit_mb) * 100, 1);
end;
$$;

revoke all on function public.get_supabase_database_usage() from public;
revoke all on function public.get_supabase_database_usage() from anon;
grant execute on function public.get_supabase_database_usage() to authenticated;

comment on function public.get_supabase_database_usage() is
  'Devuelve uso de base de datos de Supabase solo para usuarios superadmin autenticados.';
