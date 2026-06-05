import { z } from "zod";

export const pickingStartSchema = z.object({
  employeeNumber: z.string().min(1, "El legajo es obligatorio"),
  plannedPackages: z.coerce.number().positive("Los bultos deben ser mayores a cero"),
  courtId: z.string().min(1, "La cancha es obligatoria"),
});

export const pauseSchema = z.object({
  pauseReasonId: z.string().min(1, "El motivo es obligatorio"),
  notes: z.string().optional(),
});

export const qualityControlSchema = z
  .object({
    changeErrors: z.coerce.number().min(0, "No puede ser negativo"),
    surplusErrors: z.coerce.number().min(0, "No puede ser negativo"),
    missingErrors: z.coerce.number().min(0, "No puede ser negativo"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => Number.isInteger(data.changeErrors + data.surplusErrors + data.missingErrors),
    "Los errores deben ser enteros",
  );
