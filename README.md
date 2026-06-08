# App de Productividad y Eficacia de Pickeo

Aplicacion web empresarial para medir productividad, eficacia/calidad e indice operativo combinado en una operacion logistica de pickeo por cancha.

## Objetivo

Medir bultos pickeados por hora real trabajada contra el estandar de cada cancha, descontando pausas justificadas, y sumar un control posterior de errores realizado por controlista.

## Tecnologias

- React + TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL y Row Level Security
- Recharts
- Vite
- Preparada para Vercel y GitHub

## Instalacion

```bash
npm install
npm run dev
```

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No incluir claves privadas, service role ni secretos en frontend.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Supabase

Ejecutar los SQL de `supabase/` en orden:

1. `001_create_tables.sql`
2. `002_enable_rls.sql`
3. `003_create_policies.sql`
4. `004_seed_roles.sql`
5. `005_seed_work_courts.sql`
6. `006_seed_pause_reasons.sql`
7. `007_seed_employees.sql`
8. `008_seed_superadmin.sql`
9. `009_functions_and_triggers.sql`

Las tablas tienen RLS habilitado. Las funciones privilegiadas viven en `app_private` para no exponerse por la Data API.

## Superadministrador

El usuario protegido es `*********@gmail.com`.

Reglas aplicadas:

- Siempre obtiene rol `superadmin`.
- No puede ser degradado, desactivado ni eliminado desde `users_profile`.
- Ningun usuario tiene permisos superiores.
- No se hardcodean contrasenas.

## Roles y permisos

- Superadministrador: acceso total.
- Administrador: gestion operativa, maestra, usuarios, roles operativos, configuracion y auditoria, con restricciones sobre el superadmin.
- Supervisor: dashboards, reportes, sesiones, productividad, eficacia, pausas, errores y validaciones habilitadas.
- Controlista: tareas finalizadas pendientes de control y carga de errores.
- Operario: inicio, pausa, reanudacion y finalizacion de actividades.
- Solo lectura: consulta permitida sin escritura.

## Operarios precargados

Los legajos `1001` a `1010` se cargan como provisorios y editables desde administracion.

## Canchas precargadas

- Cancha 1 - Litro: 380 bultos/h
- Cancha 2 - Lata: 400 bultos/h
- Cancha 3 - Cajas: 400 bultos/h
- Cancha 4 - 500cc: 450 bultos/h
- Cancha 5 - 2L: 380 bultos/h
- Cancha 6 - 1.5L: 400 bultos/h
- Cancha 7 - MKTP: 400 bultos/h

## Manual de uso

1. El operario ingresa legajo, bultos y cancha.
2. La app valida operario activo y cancha activa.
3. Se muestra tiempo teorico estimado.
4. Al iniciar, corre el cronometro.
5. Las pausas requieren motivo obligatorio.
6. Al finalizar, se calculan tiempos y productividad.
7. El controlista carga errores de Cambio, Sobrante y Faltante.
8. La app calcula eficacia, porcentaje de error e indice operativo.
9. Supervisor/Admin consulta dashboard, reportes y auditoria.

## Formulas

- Tiempo bruto = `finished_at - started_at`
- Tiempo pausado = suma de pausas
- Tiempo neto = `gross_duration_seconds - pause_duration_seconds`
- Productividad real = `planned_packages / (net_duration_seconds / 3600)`
- Tiempo esperado = `planned_packages / expected_packages_per_hour * 3600`
- Productividad porcentual = `real_packages_per_hour / expected_packages_per_hour * 100`
- Total errores = `change_errors + surplus_errors + missing_errors`
- Bultos correctos = `planned_packages - total_error_packages`
- Porcentaje de error = `total_error_packages / planned_packages * 100`
- Eficacia = `correct_packages / planned_packages * 100`
- Indice operativo = `productivity_percentage * quality_percentage / 100`

## Diccionario de datos

- `employees`: operarios.
- `work_courts`: canchas y estandares.
- `picking_sessions`: sesiones de pickeo.
- `picking_pauses`: pausas justificadas.
- `pause_reasons`: motivos de pausa.
- `quality_controls`: controles de calidad.
- `users_profile`: perfiles, roles y estado.
- `roles`: roles y permisos.
- `settings`: configuracion general.
- `audit_logs`: auditoria.

## Supuestos aplicados

- Los bultos planificados se consideran bultos pickeados al finalizar.
- El tiempo neto excluye pausas registradas.
- La productividad se calcula contra el estandar de la cancha asignada.
- La eficacia se calcula despues del controlista.
- Los errores se miden en bultos.
- Tipos validos: Cambio, Sobrante y Faltante.
- Los legajos iniciales son provisorios y editables.
- El controlista es distinto al operario.
- El superadministrador conserva acceso total permanente.

## Pruebas minimas sugeridas

Validar login correcto/incorrecto, logout, rutas privadas, acceso por rol, inicio de actividad, pausa con y sin motivo, reanudacion, finalizacion, calculos de tiempos, productividad, carga de errores, validaciones de errores, eficacia, indice operativo, administracion de maestros, restriccion de superadmin, filtros, responsive, modo claro/oscuro, variables de entorno, lint y build.

## Deploy en Vercel

1. Subir el repositorio a GitHub.
2. Crear proyecto en Vercel.
3. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Ejecutar los SQL en Supabase.
5. Verificar Auth, RLS, seeds y usuario superadmin.
6. Deploy.

## Checklist de publicacion

- `npm install` correcto.
- `npm run dev` correcto.
- `npm run build` sin errores.
- `npm run lint` sin errores criticos.
- Variables configuradas.
- Supabase conectado.
- Tablas, RLS, politicas y seeds ejecutados.
- Superadmin protegido.
- Operarios, canchas y motivos precargados.
- Login, roles, dashboard y responsive probados.
- Sin secretos en el repositorio.

## Proximas mejoras

- Tests automatizados con Playwright/Vitest.
- Exportacion XLSX/PDF.
- Integracion con turnos reales y supervisores.
- Backups programados y monitoreo de auditoria.
