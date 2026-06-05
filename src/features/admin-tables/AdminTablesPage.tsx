import { useState } from "react";
import { ClipboardCheck, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";
import { DataTable } from "../../components/tables/DataTable";
import { Badge } from "../../components/ui/Badge";
import { useOperationsData } from "../../hooks/useOperationsData";
import { fromDateTimeLocal, toDateTimeLocal } from "../../lib/formatters/date";
import { formatPercent } from "../../lib/formatters/number";
import { formatPickingStatus, pickingStatusOptions } from "../../lib/formatters/status";
import { SUPERADMIN_EMAIL, type Employee, type PauseReason, type PickingSession, type RoleName, type WorkCourt } from "../../types/domain";

type Tab = "employees" | "courts" | "pauseReasons" | "sessions" | "pauses" | "controls" | "users" | "roles" | "settings";
type UserAdmin = { id: string; email: string; full_name: string; role: RoleName; is_active: boolean };
type RoleAdmin = { id: string; name: RoleName; description: string; is_system_role: boolean };
type SettingAdmin = { id: string; key: string; value: string; description: string };

const tabs: { id: Tab; label: string }[] = [
  { id: "employees", label: "Operarios" },
  { id: "courts", label: "Canchas" },
  { id: "pauseReasons", label: "Motivos de pausa" },
  { id: "sessions", label: "Sesiones" },
  { id: "pauses", label: "Pausas" },
  { id: "controls", label: "Controles" },
  { id: "users", label: "Usuarios" },
  { id: "roles", label: "Roles" },
  { id: "settings", label: "Configuracion" },
];

const roleOptions: RoleName[] = ["superadmin", "admin", "supervisor", "controlista", "operario", "solo_lectura"];

export function AdminTablesPage() {
  const [tab, setTab] = useState<Tab>("employees");

  return (
    <div className="grid gap-6">
      <Card>
        <h2 className="text-xl font-bold">Administracion de tablas</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
          Alta, edicion, eliminacion segura y auditoria para tablas maestras, usuarios y registros operativos.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <Button key={item.id} variant={tab === item.id ? "primary" : "secondary"} onClick={() => setTab(item.id)}>
              {item.label}
            </Button>
          ))}
        </div>
      </Card>
      {tab === "employees" ? <EmployeesAdmin /> : null}
      {tab === "courts" ? <CourtsAdmin /> : null}
      {tab === "pauseReasons" ? <PauseReasonsAdmin /> : null}
      {tab === "sessions" ? <SessionsAdmin /> : null}
      {tab === "pauses" ? <PausesAdmin /> : null}
      {tab === "controls" ? <ControlsAdmin /> : null}
      {tab === "users" ? <UsersAdmin /> : null}
      {tab === "roles" ? <RolesAdmin /> : null}
      {tab === "settings" ? <SettingsAdmin /> : null}
    </div>
  );
}

function EmployeesAdmin() {
  const { employees, upsertEmployee, deleteEmployee } = useOperationsData();
  const [form, setForm] = useState<Partial<Employee>>({});
  const save = () => {
    const now = new Date().toISOString();
    upsertEmployee({
      id: form.id ?? crypto.randomUUID(),
      employee_number: form.employee_number ?? "",
      first_name: form.first_name ?? "",
      last_name: form.last_name ?? "",
      full_name: `${form.last_name ?? ""} ${form.first_name ?? ""}`.trim(),
      shift: form.shift ?? null,
      area: form.area ?? "Pickeo",
      supervisor_id: form.supervisor_id ?? null,
      is_active: form.is_active ?? true,
      created_at: form.created_at ?? now,
      updated_at: now,
    });
    setForm({});
  };
  return (
    <AdminCrud title="Operarios" description="Permite crear, editar, activar, desactivar o eliminar legajos de operarios." onNew={() => setForm({})} onSave={save}>
      <div className="grid gap-4 md:grid-cols-5">
        <Field label="Legajo"><Input value={form.employee_number ?? ""} onChange={(e) => setForm({ ...form, employee_number: e.target.value })} /></Field>
        <Field label="Nombre"><Input value={form.first_name ?? ""} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
        <Field label="Apellido"><Input value={form.last_name ?? ""} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
        <Field label="Turno"><Input value={form.shift ?? ""} onChange={(e) => setForm({ ...form, shift: e.target.value })} /></Field>
        <Field label="Activo"><Select value={String(form.is_active ?? true)} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}><option value="true">Si</option><option value="false">No</option></Select></Field>
      </div>
      <DataTable data={employees} columns={[
        { header: "Legajo", accessorKey: "employee_number" },
        { header: "Nombre", accessorKey: "full_name" },
        { header: "Area", accessorKey: "area" },
        { header: "Estado", cell: ({ row }) => <Badge color={row.original.is_active ? "green" : "red"}>{row.original.is_active ? "Activo" : "Inactivo"}</Badge> },
        { header: "Acciones", cell: ({ row }) => <RowActions onEdit={() => setForm(row.original)} onDelete={() => deleteEmployee(row.original.id)} /> },
      ]} />
    </AdminCrud>
  );
}

function CourtsAdmin() {
  const { courts, upsertCourt, deleteCourt } = useOperationsData();
  const [form, setForm] = useState<Partial<WorkCourt>>({});
  const save = () => {
    const now = new Date().toISOString();
    upsertCourt({
      id: form.id ?? crypto.randomUUID(),
      code: form.code ?? "",
      name: form.name ?? "",
      product_type: form.product_type ?? "",
      expected_packages_per_hour: Number(form.expected_packages_per_hour ?? 0),
      is_active: form.is_active ?? true,
      created_at: form.created_at ?? now,
      updated_at: now,
    });
    setForm({});
  };
  return (
    <AdminCrud title="Canchas y estandares" description="Administra canchas activas y bultos por hora usados para productividad." onNew={() => setForm({})} onSave={save}>
      <div className="grid gap-4 md:grid-cols-5">
        <Field label="Codigo"><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
        <Field label="Nombre"><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Producto"><Input value={form.product_type ?? ""} onChange={(e) => setForm({ ...form, product_type: e.target.value })} /></Field>
        <Field label="Bultos/h"><Input type="number" value={form.expected_packages_per_hour ?? 0} onChange={(e) => setForm({ ...form, expected_packages_per_hour: Number(e.target.value) })} /></Field>
        <Field label="Activo"><Select value={String(form.is_active ?? true)} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}><option value="true">Si</option><option value="false">No</option></Select></Field>
      </div>
      <DataTable data={courts} columns={[
        { header: "Codigo", accessorKey: "code" },
        { header: "Cancha", accessorKey: "name" },
        { header: "Producto", accessorKey: "product_type" },
        { header: "Estandar", accessorKey: "expected_packages_per_hour" },
        { header: "Acciones", cell: ({ row }) => <RowActions onEdit={() => setForm(row.original)} onDelete={() => deleteCourt(row.original.id)} /> },
      ]} />
    </AdminCrud>
  );
}

function PauseReasonsAdmin() {
  const { pauseReasons, upsertPauseReason, deletePauseReason } = useOperationsData();
  const [form, setForm] = useState<Partial<PauseReason>>({});
  const save = () => {
    const now = new Date().toISOString();
    upsertPauseReason({
      id: form.id ?? crypto.randomUUID(),
      name: form.name ?? "",
      description: form.description ?? null,
      requires_observation: form.requires_observation ?? false,
      is_active: form.is_active ?? true,
      created_at: form.created_at ?? now,
      updated_at: now,
    });
    setForm({});
  };
  return (
    <AdminCrud title="Motivos de pausa" description="Define motivos disponibles para justificar interrupciones durante una actividad." onNew={() => setForm({})} onSave={save}>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Nombre"><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Descripcion"><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Requiere obs."><Select value={String(form.requires_observation ?? false)} onChange={(e) => setForm({ ...form, requires_observation: e.target.value === "true" })}><option value="false">No</option><option value="true">Si</option></Select></Field>
        <Field label="Activo"><Select value={String(form.is_active ?? true)} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}><option value="true">Si</option><option value="false">No</option></Select></Field>
      </div>
      <DataTable data={pauseReasons} columns={[
        { header: "Nombre", accessorKey: "name" },
        { header: "Descripcion", accessorKey: "description" },
        { header: "Observacion", cell: ({ row }) => row.original.requires_observation ? "Si" : "No" },
        { header: "Acciones", cell: ({ row }) => <RowActions onEdit={() => setForm(row.original)} onDelete={() => deletePauseReason(row.original.id)} /> },
      ]} />
    </AdminCrud>
  );
}

function SessionsAdmin() {
  const { sessions, employees, courts, upsertSession, deleteSession, controlSession } = useOperationsData();
  const [form, setForm] = useState<Partial<PickingSession>>({});
  const [selectedControlSessionId, setSelectedControlSessionId] = useState("");
  const [errorForm, setErrorForm] = useState({
    changeErrors: "",
    surplusErrors: "",
    missingErrors: "",
    reason: "",
  });
  const [controlMessage, setControlMessage] = useState("");
  const save = () => {
    const now = new Date().toISOString();
    const employee = employees.find((item) => item.id === form.employee_id) ?? employees[0];
    const court = courts.find((item) => item.id === form.court_id) ?? courts[0];
    if (!employee || !court) return;
    upsertSession({
      id: form.id ?? crypto.randomUUID(),
      employee_id: employee.id,
      employee_number: employee.employee_number,
      court_id: court.id,
      planned_packages: Number(form.planned_packages ?? 1),
      expected_packages_per_hour: court.expected_packages_per_hour,
      started_at: form.started_at ?? now,
      finished_at: form.finished_at ?? null,
      gross_duration_seconds: Number(form.gross_duration_seconds ?? 0),
      pause_duration_seconds: Number(form.pause_duration_seconds ?? 0),
      net_duration_seconds: Number(form.net_duration_seconds ?? 0),
      real_packages_per_hour: Number(form.real_packages_per_hour ?? 0),
      expected_completion_seconds: Number(form.expected_completion_seconds ?? 0),
      productivity_percentage: Number(form.productivity_percentage ?? 0),
      operational_index: form.operational_index ?? null,
      status: form.status ?? "draft",
      created_by: form.created_by ?? null,
      finalized_by: form.finalized_by ?? null,
      created_at: form.created_at ?? now,
      updated_at: now,
      employee,
      court,
      pauses: form.pauses ?? [],
      quality_control: form.quality_control ?? null,
    });
    setForm({});
  };
  const loadErrors = () => {
    setControlMessage("");
    if (!selectedControlSessionId) {
      setControlMessage("Debe seleccionar una sesion para cargar errores.");
      return;
    }
    const result = controlSession(selectedControlSessionId, {
      changeErrors: Number(errorForm.changeErrors || 0),
      surplusErrors: Number(errorForm.surplusErrors || 0),
      missingErrors: Number(errorForm.missingErrors || 0),
      notes: errorForm.reason,
    });
    if (result.error) {
      setControlMessage(result.error);
      return;
    }
    setErrorForm({ changeErrors: "", surplusErrors: "", missingErrors: "", reason: "" });
    setControlMessage("Errores cargados y eficacia recalculada.");
  };
  return (
    <AdminCrud title="Sesiones de pickeo" description="Permite crear, corregir estado, modificar bultos o eliminar sesiones operativas." onNew={() => setForm({})} onSave={save}>
      <div className="grid gap-4 md:grid-cols-6">
        <Field label="Operario"><Select value={form.employee_id ?? ""} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}><option value="">Seleccionar</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</Select></Field>
        <Field label="Cancha"><Select value={form.court_id ?? ""} onChange={(e) => setForm({ ...form, court_id: e.target.value })}><option value="">Seleccionar</option>{courts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
        <Field label="Bultos"><Input type="number" value={form.planned_packages ?? 1} onChange={(e) => setForm({ ...form, planned_packages: Number(e.target.value) })} /></Field>
        <Field label="Fecha y hora inicio">
          <Input
            type="datetime-local"
            value={toDateTimeLocal(form.started_at ?? new Date())}
            onChange={(e) => setForm({ ...form, started_at: fromDateTimeLocal(e.target.value) })}
          />
        </Field>
        <Field label="Fecha y hora fin">
          <Input
            type="datetime-local"
            value={form.finished_at ? toDateTimeLocal(form.finished_at) : ""}
            onChange={(e) => setForm({ ...form, finished_at: e.target.value ? fromDateTimeLocal(e.target.value) : null })}
          />
        </Field>
        <Field label="Estado">
          <Select
            value={form.status ?? "draft"}
            onChange={(e) => setForm({ ...form, status: e.target.value as PickingSession["status"] })}
          >
            {pickingStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="rounded-lg border border-[color:var(--brand-border)] bg-[color:var(--brand-panel)] p-4">
        <h4 className="flex items-center gap-2 font-semibold">
          <ClipboardCheck className="text-emerald-400" size={18} />
          Errores de pickeo
        </h4>
        <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
          Carga cantidades de errores por tipo y el motivo observado para recalcular eficacia e indice operativo.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <Field label="Sesion">
            <Select value={selectedControlSessionId} onChange={(e) => setSelectedControlSessionId(e.target.value)}>
              <option value="">Seleccionar sesion</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.employee?.full_name ?? session.employee_number} - {session.court?.name ?? session.court_id} - {session.planned_packages} bultos
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cambio">
            <Input inputMode="numeric" pattern="[0-9]*" value={errorForm.changeErrors} onChange={(e) => setErrorForm({ ...errorForm, changeErrors: e.target.value.replace(/\D/g, "") })} placeholder="0" />
          </Field>
          <Field label="Sobrante">
            <Input inputMode="numeric" pattern="[0-9]*" value={errorForm.surplusErrors} onChange={(e) => setErrorForm({ ...errorForm, surplusErrors: e.target.value.replace(/\D/g, "") })} placeholder="0" />
          </Field>
          <Field label="Faltante">
            <Input inputMode="numeric" pattern="[0-9]*" value={errorForm.missingErrors} onChange={(e) => setErrorForm({ ...errorForm, missingErrors: e.target.value.replace(/\D/g, "") })} placeholder="0" />
          </Field>
          <div className="flex items-end">
            <Button className="w-full" onClick={loadErrors}>
              <ClipboardCheck size={18} />
              Cargar errores
            </Button>
          </div>
        </div>
        <Field label="Motivo u observacion del error">
          <Textarea className="mt-2" value={errorForm.reason} onChange={(e) => setErrorForm({ ...errorForm, reason: e.target.value })} placeholder="Ej: cambio de SKU, sobrante por conteo, faltante detectado en control..." />
        </Field>
        {controlMessage ? <p className="mt-3 rounded-md bg-sky-500/10 p-3 text-sm text-sky-300">{controlMessage}</p> : null}
      </div>
      <DataTable data={sessions} columns={[
        { header: "Operario", accessorFn: (row) => row.employee?.full_name ?? row.employee_number },
        { header: "Cancha", accessorFn: (row) => row.court?.name ?? row.court_id },
        { header: "Fecha inicio", cell: ({ row }) => new Date(row.original.started_at).toLocaleString("es-AR") },
        { header: "Bultos", accessorKey: "planned_packages" },
        { header: "Errores", cell: ({ row }) => row.original.quality_control?.total_error_packages ?? 0 },
        { header: "Eficacia", cell: ({ row }) => row.original.quality_control ? formatPercent(row.original.quality_control.quality_percentage) : "Sin control" },
        { header: "Estado", cell: ({ row }) => <Badge color="blue">{formatPickingStatus(row.original.status)}</Badge> },
        {
          header: "Acciones",
          cell: ({ row }) => (
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setForm(row.original)}>Editar</Button>
              <Button variant="secondary" onClick={() => setSelectedControlSessionId(row.original.id)}>
                <ClipboardCheck size={16} />
                Errores
              </Button>
              <Button variant="danger" onClick={() => deleteSession(row.original.id)}><Trash2 size={16} />Borrar</Button>
            </div>
          ),
        },
      ]} />
    </AdminCrud>
  );
}

function PausesAdmin() {
  const { sessions } = useOperationsData();
  const pauses = sessions.flatMap((session) => (session.pauses ?? []).map((pause) => ({ ...pause, session })));
  return (
    <ReadOnlyOperationalTable title="Pausas" description="Muestra las pausas registradas por sesion; la eliminacion real debe hacerse desde la sesion asociada.">
      <DataTable data={pauses} columns={[
        { header: "Operario", accessorFn: (row) => row.session.employee?.full_name ?? row.session.employee_number },
        { header: "Motivo", accessorFn: (row) => row.reason?.name ?? row.pause_reason_id },
        { header: "Inicio", accessorKey: "pause_started_at" },
        { header: "Duracion", accessorKey: "duration_seconds" },
        { header: "Notas", accessorKey: "notes" },
      ]} />
    </ReadOnlyOperationalTable>
  );
}

function ControlsAdmin() {
  const { sessions } = useOperationsData();
  const controls = sessions.flatMap((session) => session.quality_control ? [{ ...session.quality_control, session }] : []);
  return (
    <ReadOnlyOperationalTable title="Controles de calidad" description="Consulta controles cargados y sus errores por tipo; las correcciones se auditan desde el panel de controlista.">
      <DataTable data={controls} columns={[
        { header: "Operario", accessorFn: (row) => row.session.employee?.full_name ?? row.session.employee_number },
        { header: "Cambio", accessorKey: "change_errors" },
        { header: "Sobrante", accessorKey: "surplus_errors" },
        { header: "Faltante", accessorKey: "missing_errors" },
        { header: "Eficacia", cell: ({ row }) => formatPercent(row.original.quality_percentage) },
      ]} />
    </ReadOnlyOperationalTable>
  );
}

function UsersAdmin() {
  const [users, setUsers] = useState<UserAdmin[]>([
    { id: "superadmin", email: SUPERADMIN_EMAIL, full_name: "Superadministrador", role: "superadmin", is_active: true },
  ]);
  const [form, setForm] = useState<Partial<UserAdmin>>({});
  const save = () => {
    const next: UserAdmin = {
      id: form.id ?? crypto.randomUUID(),
      email: form.email ?? "",
      full_name: form.full_name ?? "",
      role: form.email?.toLowerCase() === SUPERADMIN_EMAIL ? "superadmin" : form.role ?? "solo_lectura",
      is_active: form.email?.toLowerCase() === SUPERADMIN_EMAIL ? true : form.is_active ?? true,
    };
    setUsers((current) => current.some((item) => item.id === next.id) ? current.map((item) => item.id === next.id ? next : item) : [next, ...current]);
    setForm({});
  };
  const remove = (user: UserAdmin) => {
    if (user.email.toLowerCase() === SUPERADMIN_EMAIL) return;
    setUsers((current) => current.filter((item) => item.id !== user.id));
  };
  return (
    <AdminCrud title="Usuarios y roles" description="Crea usuarios operativos, asigna roles y respeta la proteccion del superadministrador." onNew={() => setForm({})} onSave={save}>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Email"><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Nombre"><Input value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="Rol"><Select value={form.role ?? "solo_lectura"} onChange={(e) => setForm({ ...form, role: e.target.value as RoleName })}>{roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}</Select></Field>
        <Field label="Activo"><Select value={String(form.is_active ?? true)} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}><option value="true">Si</option><option value="false">No</option></Select></Field>
      </div>
      <DataTable data={users} columns={[
        { header: "Email", accessorKey: "email" },
        { header: "Nombre", accessorKey: "full_name" },
        { header: "Rol", accessorKey: "role" },
        { header: "Estado", cell: ({ row }) => <Badge color={row.original.is_active ? "green" : "red"}>{row.original.is_active ? "Activo" : "Inactivo"}</Badge> },
        { header: "Acciones", cell: ({ row }) => <RowActions onEdit={() => setForm(row.original)} onDelete={() => remove(row.original)} disabledDelete={row.original.email.toLowerCase() === SUPERADMIN_EMAIL} /> },
      ]} />
    </AdminCrud>
  );
}

function RolesAdmin() {
  const [roles, setRoles] = useState<RoleAdmin[]>(roleOptions.map((role) => ({ id: role, name: role, description: `Rol ${role}`, is_system_role: true })));
  const [form, setForm] = useState<Partial<RoleAdmin>>({});
  const save = () => {
    const next: RoleAdmin = { id: form.id ?? crypto.randomUUID(), name: form.name ?? "solo_lectura", description: form.description ?? "", is_system_role: form.is_system_role ?? false };
    setRoles((current) => current.some((item) => item.id === next.id) ? current.map((item) => item.id === next.id ? next : item) : [next, ...current]);
    setForm({});
  };
  return (
    <AdminCrud title="Roles" description="Permite revisar y documentar roles disponibles; los roles de sistema no se eliminan." onNew={() => setForm({})} onSave={save}>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Rol"><Select value={form.name ?? "solo_lectura"} onChange={(e) => setForm({ ...form, name: e.target.value as RoleName })}>{roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}</Select></Field>
        <Field label="Descripcion"><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Rol sistema"><Select value={String(form.is_system_role ?? false)} onChange={(e) => setForm({ ...form, is_system_role: e.target.value === "true" })}><option value="false">No</option><option value="true">Si</option></Select></Field>
      </div>
      <DataTable data={roles} columns={[
        { header: "Rol", accessorKey: "name" },
        { header: "Descripcion", accessorKey: "description" },
        { header: "Sistema", cell: ({ row }) => row.original.is_system_role ? "Si" : "No" },
        { header: "Acciones", cell: ({ row }) => <RowActions onEdit={() => setForm(row.original)} onDelete={() => setRoles((current) => current.filter((item) => item.id !== row.original.id))} disabledDelete={row.original.is_system_role} /> },
      ]} />
    </AdminCrud>
  );
}

function SettingsAdmin() {
  const [settings, setSettings] = useState<SettingAdmin[]>([
    { id: "protected", key: "protected_superadmin_email", value: SUPERADMIN_EMAIL, description: "Email protegido como superadministrador permanente." },
  ]);
  const [form, setForm] = useState<Partial<SettingAdmin>>({});
  const save = () => {
    const next: SettingAdmin = { id: form.id ?? crypto.randomUUID(), key: form.key ?? "", value: form.value ?? "", description: form.description ?? "" };
    setSettings((current) => current.some((item) => item.id === next.id) ? current.map((item) => item.id === next.id ? next : item) : [next, ...current]);
    setForm({});
  };
  return (
    <AdminCrud title="Configuracion general" description="Administra claves de configuracion visibles y auditables de la aplicacion." onNew={() => setForm({})} onSave={save}>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Clave"><Input value={form.key ?? ""} onChange={(e) => setForm({ ...form, key: e.target.value })} /></Field>
        <Field label="Valor"><Input value={form.value ?? ""} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
        <Field label="Descripcion"><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      </div>
      <DataTable data={settings} columns={[
        { header: "Clave", accessorKey: "key" },
        { header: "Valor", accessorKey: "value" },
        { header: "Descripcion", accessorKey: "description" },
        { header: "Acciones", cell: ({ row }) => <RowActions onEdit={() => setForm(row.original)} onDelete={() => setSettings((current) => current.filter((item) => item.id !== row.original.id))} disabledDelete={row.original.key === "protected_superadmin_email"} /> },
      ]} />
    </AdminCrud>
  );
}

function AdminCrud({ title, description, onNew, onSave, children }: { title: string; description: string; onNew: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm text-[color:var(--brand-muted)]">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onNew}><Plus size={18} />Alta</Button>
          <Button onClick={onSave}><Save size={18} />Guardar</Button>
        </div>
      </div>
      <div className="grid gap-5">{children}</div>
    </Card>
  );
}

function RowActions({ onEdit, onDelete, disabledDelete }: { onEdit: () => void; onDelete: () => void; disabledDelete?: boolean }) {
  return (
    <div className="flex justify-center gap-2">
      <Button variant="secondary" onClick={onEdit}>Editar</Button>
      <Button variant="danger" onClick={onDelete} disabled={disabledDelete}><Trash2 size={16} />Borrar</Button>
    </div>
  );
}

function ReadOnlyOperationalTable({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 mb-4 text-sm text-[color:var(--brand-muted)]">{description}</p>
      {children}
    </Card>
  );
}
