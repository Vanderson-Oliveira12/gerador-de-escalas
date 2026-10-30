import { z } from "zod";

export const participantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve conter pelo menos 2 caracteres.")
    .max(100, "O nome deve conter no máximo 100 caracteres."),

  active: z.boolean(),

  allowedActivityIds: z
    .array(z.string().min(1))
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Existem atividades duplicadas.",
    ),

  unavailableDates: z
    .array(z.iso.date())
    .refine(
      (dates) => new Set(dates).size === dates.length,
      "Existem datas duplicadas.",
    ),

  maxActivitiesPerMeeting: z
    .number()
    .int("Informe um número inteiro.")
    .min(1, "O limite mínimo é 1.")
    .max(20, "O limite máximo é 20.")
    .nullable(),
});

export const createParticipantSchema = participantSchema;

export const updateParticipantSchema = participantSchema.partial();

export type ParticipantFormValues = z.input<typeof participantSchema>;
