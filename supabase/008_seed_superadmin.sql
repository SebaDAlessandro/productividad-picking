-- Este seed prepara la restriccion logica. El perfil real se crea automaticamente
-- cuando exista un auth.users.email = 'sebadalessandro@gmail.com'.
insert into public.settings (key, value, description)
values (
  'protected_superadmin_email',
  '{"email": "sebadalessandro@gmail.com"}',
  'Usuario protegido: siempre superadmin, no degradable, no desactivable.'
)
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();
