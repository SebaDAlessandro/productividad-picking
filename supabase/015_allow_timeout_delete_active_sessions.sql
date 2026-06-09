drop policy if exists "delete own active sessions on timeout" on public.picking_sessions;

create policy "delete own active sessions on timeout"
on public.picking_sessions
for delete
to authenticated
using (
  status in ('in_progress', 'paused')
  and (
    exists (
      select 1
      from public.users_profile up
      where up.auth_user_id = (select auth.uid())
        and up.is_active
        and up.role = 'operario'
        and up.employee_id = picking_sessions.employee_id
    )
    or exists (
      select 1
      from public.users_profile up
      where up.auth_user_id = (select auth.uid())
        and up.is_active
        and up.role in ('supervisor', 'controlista')
        and up.id = picking_sessions.created_by
    )
  )
);
