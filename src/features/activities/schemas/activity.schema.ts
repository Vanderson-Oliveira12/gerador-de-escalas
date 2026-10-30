import { z } from "zod";

export const activitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome da atividade.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),

  durationMinutes: z
    .number()
    .int("Informe um número inteiro.")
    .min(1, "A duração mínima é 1 minuto.")
    .max(180, "A duração máxima é 180 minutos."),

  order: z.number().int().min(0),

  requiredParticipants: z
    .number()
    .int("Informe um número inteiro.")
    .min(1, "É necessário pelo menos um responsável.")
    .max(20, "O máximo é 20 responsáveis."),

  active: z.boolean(),
});

export const createActivitySchema = activitySchema;

export const updateActivitySchema = activitySchema.partial();

export type ActivityFormValues = z.infer<typeof activitySchema>;
