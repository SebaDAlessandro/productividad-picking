create extension if not exists pgcrypto;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text not null unique,
  first_name text not null,
  last_name text not null,
  full_name text not null,
  shift text,
  area text not null default 'Pickeo',
  supervisor_id uuid references public.employees(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_courts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  product_type text not null,
  expected_packages_per_hour numeric(10,2) not null check (expected_packages_per_hour > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pause_reasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  requires_observation boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users_profile (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null check (role in ('superadmin','admin','supervisor','controlista','operario','solo_lectura')),
  employee_id uuid references public.employees(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  permissions jsonb not null default '{}'::jsonb,
  is_system_role boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.picking_sessions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id),
  employee_number text not null,
  court_id uuid not null references public.work_courts(id),
  planned_packages integer not null check (planned_packages > 0),
  expected_packages_per_hour numeric(10,2) not null check (expected_packages_per_hour > 0),
  started_at timestamptz not null,
  finished_at timestamptz,
  gross_duration_seconds integer not null default 0 check (gross_duration_seconds >= 0),
  pause_duration_seconds integer not null default 0 check (pause_duration_seconds >= 0),
  net_duration_seconds integer not null default 0 check (net_duration_seconds >= 0),
  real_packages_per_hour numeric(10,2) not null default 0,
  expected_completion_seconds integer not null default 0,
  productivity_percentage numeric(10,2) not null default 0,
  operational_index numeric(10,2),
  status text not null default 'draft' check (status in ('draft','in_progress','paused','finished_pending_control','controlled','cancelled')),
  created_by uuid references public.users_profile(id),
  finalized_by uuid references public.users_profile(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.picking_pauses (
  id uuid primary key default gen_random_uuid(),
  picking_session_id uuid not null references public.picking_sessions(id) on delete cascade,
  pause_reason_id uuid not null references public.pause_reasons(id),
  pause_started_at timestamptz not null,
  pause_finished_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  notes text,
  created_by uuid references public.users_profile(id),
  created_at timestamptz not null default now()
);

create table if not exists public.quality_controls (
  id uuid primary key default gen_random_uuid(),
  picking_session_id uuid not null unique references public.picking_sessions(id) on delete cascade,
  controlled_by uuid not null references public.users_profile(id),
  controlled_at timestamptz not null default now(),
  change_errors integer not null default 0 check (change_errors >= 0),
  surplus_errors integer not null default 0 check (surplus_errors >= 0),
  missing_errors integer not null default 0 check (missing_errors >= 0),
  total_error_packages integer not null default 0 check (total_error_packages >= 0),
  correct_packages integer not null default 0 check (correct_packages >= 0),
  error_percentage numeric(10,2) not null default 0,
  quality_percentage numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references public.users_profile(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users_profile(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.work_courts, public.pause_reasons to anon;
