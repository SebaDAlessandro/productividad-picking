import { useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";

const content = {
  manual: {
    title: "Manual de uso",
    description: "Explica los pasos operativos para usar la aplicacion en pickeo, control y administracion.",
    items: [
      "Iniciar pickeo: ingresar legajo, validar operario activo, cargar bultos y seleccionar cancha.",
      "Pausar y reanudar: toda pausa exige motivo; si el motivo lo requiere, agregar observacion.",
      "Finalizar: no se permite finalizar con una pausa abierta; la actividad queda pendiente de control.",
      "Control de errores: el controlista carga Cambio, Sobrante y Faltante, mas observaciones.",
      "Interpretar productividad: compara bultos por hora real contra el estandar de la cancha.",
      "Interpretar eficacia: mide bultos correctos sobre bultos pickeados despues del control.",
      "Interpretar indice operativo: combina productividad y eficacia en un indicador unico.",
      "Filtros: usar fecha, turno, operario, cancha, supervisor, estado, error y motivo de pausa.",
      "Administracion: gestionar operarios, canchas, estandares, motivos, usuarios, roles y configuracion.",
    ],
  },
  formulas: {
    title: "Detalle de formulas",
    description: "Muestra como se calculan tiempos, productividad, eficacia, errores e indice operativo.",
    items: [
      "Tiempo bruto = finished_at - started_at.",
      "Tiempo pausado = suma de todas las pausas asociadas a la actividad.",
      "Tiempo neto = gross_duration_seconds - pause_duration_seconds.",
      "Productividad real por hora = planned_packages / (net_duration_seconds / 3600).",
      "Tiempo esperado en segundos = planned_packages / expected_packages_per_hour * 3600.",
      "Productividad porcentual = real_packages_per_hour / expected_packages_per_hour * 100.",
      "Total errores = change_errors + surplus_errors + missing_errors.",
      "Bultos correctos = planned_packages - total_error_packages.",
      "Porcentaje de error = total_error_packages / planned_packages * 100.",
      "Eficacia = correct_packages / planned_packages * 100.",
      "Indice operativo = productivity_percentage * quality_percentage / 100.",
      "Semaforo productividad: verde >=100%, amarillo >=90% y <100%, rojo <90%.",
      "Semaforo eficacia: verde >=99%, amarillo >=97% y <99%, rojo <97%.",
    ],
  },
  dictionary: {
    title: "Diccionario de datos",
    description: "Describe las tablas principales y el significado operativo de cada entidad.",
    items: [
      "employees: maestro de operarios, legajo, nombre, turno, area, supervisor y estado.",
      "work_courts: canchas de trabajo con producto y estandar de bultos por hora.",
      "picking_sessions: actividades de pickeo con tiempos, bultos, productividad, estado e indice.",
      "picking_pauses: pausas de una actividad con motivo, inicio, fin, duracion y observaciones.",
      "pause_reasons: catalogo de motivos de pausa y obligatoriedad de observacion.",
      "quality_controls: control posterior con errores, bultos correctos, error porcentual y eficacia.",
      "users_profile: perfil operativo del usuario autenticado, rol, email, empleado vinculado y estado.",
      "roles: roles del sistema con permisos JSON y bandera de rol de sistema.",
      "settings: configuracion general auditable.",
      "audit_logs: trazabilidad de acciones importantes con usuario, entidad, valores previos y nuevos.",
    ],
  },
  assumptions: {
    title: "Supuestos aplicados",
    description: "Lista los criterios usados para interpretar bultos, tiempos, errores, roles y controles.",
    items: [
      "Los bultos planificados se consideran bultos pickeados al finalizar la actividad.",
      "El tiempo neto excluye pausas registradas.",
      "La productividad se calcula contra el estandar de la cancha asignada.",
      "La eficacia se calcula despues del controlista.",
      "Los errores se miden en bultos.",
      "Tipos de error validos: Cambio, Sobrante y Faltante.",
      "Los legajos iniciales son provisorios y editables.",
      "El controlista es un usuario distinto al operario.",
      "El administrador puede modificar tablas operativas y maestras.",
      "El superadministrador conserva acceso total permanente.",
    ],
  },
};

export function DocsPage() {
  const { section = "manual" } = useParams();
  const selected = content[section as keyof typeof content] ?? content.manual;
  return (
    <Card>
      <h2 className="text-xl font-bold">{selected.title}</h2>
      <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
        {selected.description}
      </p>
      <p className="mt-1 text-sm text-[color:var(--brand-muted)]">
        Ultima actualizacion: 04/06/2026.
      </p>
      <ul className="mt-5 grid gap-3">
        {selected.items.map((item) => (
          <li key={item} className="rounded-md border border-[color:var(--brand-border)] bg-[color:var(--brand-panel)] p-3 text-sm">
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
