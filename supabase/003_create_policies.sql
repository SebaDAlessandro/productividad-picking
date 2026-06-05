create schema if not exists app_private;

create or replace function app_private.current_user_role()
returns text
language sql
security definer
set search_path = public, app_private
stable
as $$
  select case
    when lower(coalesce(auth.email(), '')) = 'sebadalessandro@gmail.com' then 'superadmin'
    else coalesce((select role from public.users_profile where auth_user_id = auth.uid() and is_active = true), 'solo_lectura')
  end
$$;

create or replace function app_private.is_role(roles text[])
returns boolean
language sql
security definer
set search_path = public, app_private
stable
as $$
  select app_private.current_user_role() = any(roles)
$$;

create policy "profiles read own or manager" on public.users_profile
for select using (
  auth_user_id = auth.uid() or app_private.is_role(array['superadmin','admin'])
);

create policy "profiles managed by admin" on public.users_profile
for all using (app_private.is_role(array['superadmin','admin']))
with check (app_private.is_role(array['superadmin','admin']));

create policy "read operational masters" on public.employees
for select using (app_private.is_role(array['superadmin','admin','supervisor','controlista','operario','solo_lectura']));
create policy "write employees by managers" on public.employees
for all using (app_private.is_role(array['superadmin','admin']))
with check (app_private.is_role(array['superadmin','admin']));

create policy "read courts" on public.work_courts
for select using (app_private.is_role(array['superadmin','admin','supervisor','controlista','operario','solo_lectura']));
create policy "write courts by managers" on public.work_courts
for all using (app_private.is_role(array['superadmin','admin']))
with check (app_private.is_role(array['superadmin','admin']));

create policy "read pause reasons" on public.pause_reasons
for select using (app_private.is_role(array['superadmin','admin','supervisor','controlista','operario','solo_lectura']));
create policy "write pause reasons by managers" on public.pause_reasons
for all using (app_private.is_role(array['superadmin','admin']))
with check (app_private.is_role(array['superadmin','admin']));

create policy "read sessions by role" on public.picking_sessions
for select using (
  app_private.is_role(array['superadmin','admin','supervisor','controlista','solo_lectura'])
  or exists (
    select 1 from public.users_profile up
    where up.auth_user_id = auth.uid()
      and up.employee_id = picking_sessions.employee_id
      and up.role = 'operario'
      and up.is_active
  )
);

create policy "insert sessions by operator or manager" on public.picking_sessions
for insert with check (app_private.is_role(array['superadmin','admin','operario']));

create policy "update sessions by permitted roles" on public.picking_sessions
for update using (app_private.is_role(array['superadmin','admin','supervisor','controlista','operario']))
with check (app_private.is_role(array['superadmin','admin','supervisor','controlista','operario']));

create policy "delete sessions by managers" on public.picking_sessions
for delete using (app_private.is_role(array['superadmin','admin']));

create policy "read pauses by role" on public.picking_pauses
for select using (app_private.is_role(array['superadmin','admin','supervisor','controlista','solo_lectura','operario']));
create policy "write pauses by operator or manager" on public.picking_pauses
for all using (app_private.is_role(array['superadmin','admin','operario']))
with check (app_private.is_role(array['superadmin','admin','operario']));

create policy "read quality controls" on public.quality_controls
for select using (app_private.is_role(array['superadmin','admin','supervisor','controlista','solo_lectura']));
create policy "write quality controls" on public.quality_controls
for all using (app_private.is_role(array['superadmin','admin','supervisor','controlista']))
with check (app_private.is_role(array['superadmin','admin','supervisor','controlista']));

create policy "roles read" on public.roles
for select using (app_private.is_role(array['superadmin','admin']));
create policy "roles write superadmin" on public.roles
for all using (app_private.is_role(array['superadmin'])) with check (app_private.is_role(array['superadmin']));

create policy "settings read managers" on public.settings
for select using (app_private.is_role(array['superadmin','admin']));
create policy "settings write managers" on public.settings
for all using (app_private.is_role(array['superadmin','admin'])) with check (app_private.is_role(array['superadmin','admin']));

create policy "audit read managers" on public.audit_logs
for select using (app_private.is_role(array['superadmin','admin']));
create policy "audit insert authenticated" on public.audit_logs
for insert with check (auth.uid() is not null);
create policy "audit immutable except superadmin" on public.audit_logs
for delete using (app_private.is_role(array['superadmin']));
