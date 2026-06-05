insert into public.roles (name, description, permissions, is_system_role) values
('superadmin', 'Acceso total absoluto.', '{"all": true}', true),
('admin', 'Gestion operativa, maestra, usuarios y auditoria con restricciones sobre superadmin.', '{"admin": true}', true),
('supervisor', 'Dashboard, reportes, sesiones y validaciones habilitadas.', '{"dashboard": true, "reports": true}', true),
('controlista', 'Carga controles de calidad sobre actividades finalizadas.', '{"quality_controls": true}', true),
('operario', 'Inicio, pausa, reanudacion y finalizacion de actividades propias.', '{"picking": true}', true),
('solo_lectura', 'Consulta de dashboard y reportes permitidos.', '{"read_only": true}', true)
on conflict (name) do update set
  description = excluded.description,
  permissions = excluded.permissions,
  is_system_role = excluded.is_system_role,
  updated_at = now();
