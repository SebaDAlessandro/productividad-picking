alter table public.picking_sessions
  add column if not exists sheet_number text;

comment on column public.picking_sessions.sheet_number is
  'Numero de planilla proveniente del sistema Chess para identificar la actividad de pickeo.';
