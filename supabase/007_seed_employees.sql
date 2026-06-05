insert into public.employees (
  employee_number,
  first_name,
  last_name,
  full_name,
  shift,
  area,
  is_active
) values
('1001', 'Matias', 'Arroyo', 'Arroyo Matias', null, 'Pickeo', true),
('1002', 'Julio', 'Baez', 'Baez Julio', null, 'Pickeo', true),
('1003', 'Javier', 'Baldebenito', 'Baldebenito Javier', null, 'Pickeo', true),
('1004', 'Leonardo', 'Cabeza', 'Cabeza Leonardo', null, 'Pickeo', true),
('1005', 'Raul', 'Quesada', 'Quesada Raul', null, 'Pickeo', true),
('1006', 'Carlos', 'Martinez', 'Martinez Carlos', null, 'Pickeo', true),
('1007', 'Juan', 'Rodriguez', 'Rodriguez Juan', null, 'Pickeo', true),
('1008', 'Enrique', 'Rolon', 'Rolon Enrique', null, 'Pickeo', true),
('1009', 'Matias', 'Yglesias', 'Yglesias Matias', null, 'Pickeo', true),
('1010', 'Rafael', 'Zanabria', 'Zanabria Rafael', null, 'Pickeo', true)
on conflict (employee_number) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  full_name = excluded.full_name,
  area = excluded.area,
  is_active = excluded.is_active,
  updated_at = now();
