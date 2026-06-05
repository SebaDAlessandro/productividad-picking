insert into public.pause_reasons (name, description, requires_observation, is_active) values
('Falta de stock', null, false, true),
('Espera de reposicion', null, false, true),
('Problema de equipo', null, false, true),
('Consulta al supervisor', null, false, true),
('Interferencia operativa', null, false, true),
('Cambio de prioridad', null, false, true),
('Descanso autorizado', null, false, true),
('Otro', null, true, true)
on conflict (name) do update set
  description = excluded.description,
  requires_observation = excluded.requires_observation,
  is_active = excluded.is_active,
  updated_at = now();
