create schema if not exists app_private;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, app_private
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.ensure_superadmin_profile()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  if lower(new.email) = 'sebadalessandro@gmail.com' then
    insert into public.users_profile (auth_user_id, email, full_name, role, is_active)
    values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'full_name', 'Superadministrador'), 'superadmin', true)
    on conflict (auth_user_id) do update set
      email = excluded.email,
      role = 'superadmin',
      is_active = true,
      updated_at = now();
  else
    insert into public.users_profile (auth_user_id, email, full_name, role, is_active)
    values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'full_name', null), 'solo_lectura', true)
    on conflict (auth_user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert or update of email on auth.users
for each row execute function app_private.ensure_superadmin_profile();

create or replace function app_private.protect_superadmin_profile()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  if tg_op = 'DELETE' and lower(old.email) = 'sebadalessandro@gmail.com' then
    raise exception 'El superadministrador protegido no puede ser eliminado';
  end if;

  if lower(coalesce(old.email, new.email)) = 'sebadalessandro@gmail.com' then
    if new.role <> 'superadmin' or new.is_active is not true then
      raise exception 'El superadministrador protegido no puede ser degradado ni desactivado';
    end if;
    new.email = 'sebadalessandro@gmail.com';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists protect_superadmin_before_change on public.users_profile;
create trigger protect_superadmin_before_change
before update or delete on public.users_profile
for each row execute function app_private.protect_superadmin_profile();

create or replace function app_private.validate_quality_control()
returns trigger
language plpgsql
set search_path = public, app_private
as $$
declare
  planned integer;
begin
  select planned_packages into planned
  from public.picking_sessions
  where id = new.picking_session_id;

  new.total_error_packages = new.change_errors + new.surplus_errors + new.missing_errors;
  if new.total_error_packages > planned then
    raise exception 'La suma de errores no puede superar los bultos pickeados';
  end if;

  new.correct_packages = planned - new.total_error_packages;
  new.error_percentage = case when planned > 0 then new.total_error_packages::numeric / planned * 100 else 0 end;
  new.quality_percentage = case when planned > 0 then new.correct_packages::numeric / planned * 100 else 0 end;
  return new;
end;
$$;

drop trigger if exists validate_quality_control_before_save on public.quality_controls;
create trigger validate_quality_control_before_save
before insert or update on public.quality_controls
for each row execute function app_private.validate_quality_control();

create or replace function app_private.update_session_after_quality()
returns trigger
language plpgsql
set search_path = public, app_private
as $$
begin
  update public.picking_sessions
  set
    status = 'controlled',
    operational_index = productivity_percentage * new.quality_percentage / 100,
    updated_at = now()
  where id = new.picking_session_id;
  return new;
end;
$$;

drop trigger if exists update_session_after_quality_save on public.quality_controls;
create trigger update_session_after_quality_save
after insert or update on public.quality_controls
for each row execute function app_private.update_session_after_quality();

create or replace function app_private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
declare
  actor uuid;
begin
  select id into actor from public.users_profile where auth_user_id = auth.uid();
  insert into public.audit_logs (user_id, action, entity, entity_id, old_value, new_value)
  values (
    actor,
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'employees','work_courts','pause_reasons','picking_sessions',
    'picking_pauses','quality_controls','users_profile','roles','settings'
  ]
  loop
    execute format('drop trigger if exists audit_%I_changes on public.%I', table_name, table_name);
    execute format(
      'create trigger audit_%I_changes after insert or update or delete on public.%I for each row execute function app_private.audit_row_change()',
      table_name,
      table_name
    );
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'employees','work_courts','pause_reasons','picking_sessions',
    'quality_controls','users_profile','roles','settings'
  ]
  loop
    execute format('drop trigger if exists touch_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger touch_%I_updated_at before update on public.%I for each row execute function app_private.touch_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;
