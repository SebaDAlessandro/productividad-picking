import { subDays } from "date-fns";
import type {
  AuditLog,
  Employee,
  PauseReason,
  PickingSession,
  QualityControl,
  UserProfile,
  WorkCourt,
} from "../../types/domain";

const now = new Date().toISOString();

export const demoEmployees: Employee[] = [
  ["1001", "Matias", "Arroyo"],
  ["1002", "Julio", "Baez"],
  ["1003", "Javier", "Baldebenito"],
  ["1004", "Leonardo", "Cabeza"],
  ["1005", "Raul", "Quesada"],
  ["1006", "Carlos", "Martinez"],
  ["1007", "Juan", "Rodriguez"],
  ["1008", "Enrique", "Rolon"],
  ["1009", "Matias", "Yglesias"],
  ["1010", "Rafael", "Zanabria"],
].map(([employee_number, first_name, last_name], index) => ({
  id: `emp-${employee_number}`,
  employee_number,
  first_name,
  last_name,
  full_name: `${last_name} ${first_name}`,
  shift: index % 2 === 0 ? "Manana" : "Tarde",
  area: "Pickeo",
  supervisor_id: null,
  is_active: true,
  created_at: now,
  updated_at: now,
}));

export const demoCourts: WorkCourt[] = [
  ["CANCHA_1", "Cancha 1", "Litro", 380],
  ["CANCHA_2", "Cancha 2", "Lata", 400],
  ["CANCHA_3", "Cancha 3", "Cajas", 400],
  ["CANCHA_4", "Cancha 4", "500cc", 450],
  ["CANCHA_5", "Cancha 5", "2L", 380],
  ["CANCHA_6", "Cancha 6", "1.5L", 400],
  ["CANCHA_7", "Cancha 7", "MKTP", 400],
].map(([code, name, product_type, expected_packages_per_hour]) => ({
  id: String(code).toLowerCase(),
  code: String(code),
  name: String(name),
  product_type: String(product_type),
  expected_packages_per_hour: Number(expected_packages_per_hour),
  is_active: true,
  created_at: now,
  updated_at: now,
}));

export const demoPauseReasons: PauseReason[] = [
  "Falta de stock",
  "Espera de reposicion",
  "Problema de equipo",
  "Consulta al supervisor",
  "Interferencia operativa",
  "Cambio de prioridad",
  "Descanso autorizado",
  "Otro",
].map((name) => ({
  id: name.toLowerCase().replaceAll(" ", "-"),
  name,
  description: null,
  requires_observation: name === "Otro",
  is_active: true,
  created_at: now,
  updated_at: now,
}));

const qualityControls: QualityControl[] = [];

export const demoSessions: PickingSession[] = demoEmployees.slice(0, 8).map((employee, index) => {
  const court = demoCourts[index % demoCourts.length];
  const planned = 360 + index * 24;
  const productivity = 86 + index * 3.2;
  const realPackagesPerHour = (court.expected_packages_per_hour * productivity) / 100;
  const netSeconds = Math.round((planned / realPackagesPerHour) * 3600);
  const pauseSeconds = index % 3 === 0 ? 540 : 180;
  const grossSeconds = netSeconds + pauseSeconds;
  const startedAt = subDays(new Date(), 7 - index);
  const finishedAt = new Date(startedAt.getTime() + grossSeconds * 1000);
  const id = `session-${index + 1}`;
  const change = index % 2;
  const surplus = index % 3 === 0 ? 2 : 0;
  const missing = index % 4 === 0 ? 1 : 0;
  const total = change + surplus + missing;
  const quality = {
    id: `qc-${id}`,
    picking_session_id: id,
    controlled_by: "demo-controlista",
    controlled_at: finishedAt.toISOString(),
    change_errors: change,
    surplus_errors: surplus,
    missing_errors: missing,
    total_error_packages: total,
    correct_packages: planned - total,
    error_percentage: (total / planned) * 100,
    quality_percentage: ((planned - total) / planned) * 100,
    notes: index % 2 === 0 ? "Control sin novedades criticas." : null,
    created_at: now,
    updated_at: now,
  };
  qualityControls.push(quality);
  return {
    id,
    employee_id: employee.id,
    employee_number: employee.employee_number,
    sheet_number: `CH-${String(index + 1).padStart(4, "0")}`,
    court_id: court.id,
    planned_packages: planned,
    expected_packages_per_hour: court.expected_packages_per_hour,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
    gross_duration_seconds: grossSeconds,
    pause_duration_seconds: pauseSeconds,
    net_duration_seconds: netSeconds,
    real_packages_per_hour: realPackagesPerHour,
    expected_completion_seconds: Math.round((planned / court.expected_packages_per_hour) * 3600),
    productivity_percentage: productivity,
    operational_index: (productivity * quality.quality_percentage) / 100,
    status: index === 7 ? "finished_pending_control" : "controlled",
    created_by: null,
    finalized_by: null,
    created_at: now,
    updated_at: now,
    employee,
    court,
    quality_control: index === 7 ? null : quality,
    pauses: [],
  };
});

export const demoQualityControls = qualityControls;

export const demoProfiles: UserProfile[] = [
  {
    id: "profile-super",
    auth_user_id: "auth-super",
    email: "sebadalessandro@gmail.com",
    full_name: "Superadministrador",
    role: "superadmin",
    employee_id: null,
    is_active: true,
    created_at: now,
    updated_at: now,
  },
];

export const demoAuditLogs: AuditLog[] = [
  {
    id: "audit-1",
    user_id: "profile-super",
    action: "seed",
    entity: "system",
    entity_id: null,
    old_value: null,
    new_value: { message: "Datos iniciales cargados" },
    created_at: now,
  },
];
