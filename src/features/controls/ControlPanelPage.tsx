import { useState } from "react";
import { Check, ClipboardCheck } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Field, Input, Textarea } from "../../components/ui/Field";
import { DataTable } from "../../components/tables/DataTable";
import { Badge } from "../../components/ui/Badge";
import { useOperationsData } from "../../hooks/useOperationsData";
import { formatPickingStatus } from "../../lib/formatters/status";
import type { PickingSession } from "../../types/domain";

export function ControlPanelPage() {
  const { sessions, controlSession } = useOperationsData();
  const pending = sessions.filter((session) => session.status === "finished_pending_control");
  const [selected, setSelected] = useState<PickingSession | null>(null);
  const [changeErrors, setChangeErrors] = useState("");
  const [surplusErrors, setSurplusErrors] = useState("");
  const [missingErrors, setMissingErrors] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  function submit() {
    if (!selected) return;
    const result = controlSession(selected.id, {
      changeErrors: Number(changeErrors || 0),
      surplusErrors: Number(surplusErrors || 0),
      missingErrors: Number(missingErrors || 0),
      notes,
    });
    setMessage(result.error ?? "Control confirmado. La actividad quedo controlada.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card>
        <h2 className="text-xl font-bold">Actividades pendientes de control</h2>
        <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
          Lista las actividades finalizadas que todavia necesitan validacion de errores.
        </p>
        <div className="mt-4">
          <DataTable
            data={pending}
            columns={[
              {
                header: "Seleccion",
                cell: ({ row }) =>
                  selected?.id === row.original.id ? (
                    <span
                      className="inline-grid size-7 place-items-center rounded-full bg-emerald-500 text-slate-950"
                      title="Actividad seleccionada"
                    >
                      <Check size={16} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="inline-block size-7 rounded-full border border-[color:var(--brand-border)]" />
                  ),
              },
              { header: "Operario", accessorFn: (row) => row.employee?.full_name ?? row.employee_number },
              { header: "Legajo", accessorKey: "employee_number" },
              { header: "Cancha", accessorFn: (row) => row.court?.name },
              { header: "Bultos", accessorKey: "planned_packages" },
              { header: "Estado", cell: ({ row }) => <Badge color="yellow">{formatPickingStatus(row.original.status)}</Badge> },
              {
                header: "Accion",
                cell: ({ row }) => {
                  const isSelected = selected?.id === row.original.id;
                  return (
                    <Button
                      variant={isSelected ? "primary" : "secondary"}
                      onClick={() => setSelected(row.original)}
                    >
                      {isSelected ? (
                        <>
                          <Check size={16} />
                          Seleccionada
                        </>
                      ) : (
                        "Seleccionar"
                      )}
                    </Button>
                  );
                },
              },
            ]}
          />
        </div>
      </Card>
      <Card>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <ClipboardCheck className="text-emerald-400" />
          Formulario de control
        </h2>
        <p className="mt-2 text-sm text-[color:var(--brand-muted)]">
          Los errores no pueden ser negativos ni superar los bultos pickeados.
        </p>
        <div className="mt-5 grid gap-4">
          <Field label="Cambio">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={changeErrors}
              onChange={(e) => setChangeErrors(e.target.value.replace(/\D/g, ""))}
              placeholder="Ingresar cantidad"
            />
          </Field>
          <Field label="Sobrante">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={surplusErrors}
              onChange={(e) => setSurplusErrors(e.target.value.replace(/\D/g, ""))}
              placeholder="Ingresar cantidad"
            />
          </Field>
          <Field label="Faltante">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={missingErrors}
              onChange={(e) => setMissingErrors(e.target.value.replace(/\D/g, ""))}
              placeholder="Ingresar cantidad"
            />
          </Field>
          <Field label="Observaciones"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <Button onClick={submit} disabled={!selected}>Confirmar control</Button>
        </div>
        {selected ? <p className="mt-4 text-sm text-[color:var(--brand-muted)]">Seleccionada: {selected.employee?.full_name}</p> : null}
        {message ? <p className="mt-4 rounded-md bg-sky-500/10 p-3 text-sm text-sky-300">{message}</p> : null}
      </Card>
    </div>
  );
}
