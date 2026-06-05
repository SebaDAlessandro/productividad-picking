insert into public.work_courts (code, name, product_type, expected_packages_per_hour, is_active) values
('CANCHA_1', 'Cancha 1', 'Litro', 380, true),
('CANCHA_2', 'Cancha 2', 'Lata', 400, true),
('CANCHA_3', 'Cancha 3', 'Cajas', 400, true),
('CANCHA_4', 'Cancha 4', '500cc', 450, true),
('CANCHA_5', 'Cancha 5', '2L', 380, true),
('CANCHA_6', 'Cancha 6', '1.5L', 400, true),
('CANCHA_7', 'Cancha 7', 'MKTP', 400, true)
on conflict (code) do update set
  name = excluded.name,
  product_type = excluded.product_type,
  expected_packages_per_hour = excluded.expected_packages_per_hour,
  is_active = excluded.is_active,
  updated_at = now();
