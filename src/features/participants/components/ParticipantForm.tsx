import { useEffect } from "react";

import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { LoaderCircle, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  participantSchema,
  type ParticipantFormValues,
} from "../schemas/participant.schema";

import type { Participant } from "../types/participant.types";

import {
  ParticipantActivitySelector,
  type ActivityOption,
} from "./ParticipantActivitySelector";

import { ParticipantAvailability } from "./ParticipantAvailability";

interface ParticipantFormProps {
  participant?: Participant | null;

  activities: ActivityOption[];

  loading?: boolean;

  onSubmit: (values: ParticipantFormValues) => Promise<void>;

  onCancel: () => void;
}

const DEFAULT_VALUES: ParticipantFormValues = {
  name: "",
  active: true,
  allowedActivityIds: [],
  unavailableDates: [],
  maxActivitiesPerMeeting: null,
};

export function ParticipantForm({
  participant,
  activities,
  loading = false,
  onSubmit,
  onCancel,
}: ParticipantFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!participant) {
      reset(DEFAULT_VALUES);
      return;
    }

    reset({
      name: participant.name,
      active: participant.active,
      allowedActivityIds: participant.allowedActivityIds,
      unavailableDates: participant.unavailableDates,
      maxActivitiesPerMeeting: participant.maxActivitiesPerMeeting,
    });
  }, [participant, reset]);

  const submitting = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="participant-name">Nome do participante</Label>

        <Input
          id="participant-name"
          placeholder="Ex.: Vanderson"
          disabled={submitting}
          aria-invalid={!!errors.name}
          {...register("name")}
        />

        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Status */}
      <Controller
        name="active"
        control={control}
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div>
              <Label htmlFor="participant-active">Participante ativo</Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Participantes inativos não serão escalados.
              </p>
            </div>

            <Switch
              id="participant-active"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={submitting}
            />
          </div>
        )}
      />

      {/* Atividades */}
      <Controller
        name="allowedActivityIds"
        control={control}
        render={({ field }) => (
          <ParticipantActivitySelector
            value={field.value}
            onChange={field.onChange}
            activities={activities}
            disabled={submitting}
          />
        )}
      />

      {/* Indisponibilidades */}
      <Controller
        name="unavailableDates"
        control={control}
        render={({ field }) => (
          <ParticipantAvailability
            value={field.value}
            onChange={field.onChange}
            disabled={submitting}
          />
        )}
      />

      {/* Limite */}
      <Controller
        name="maxActivitiesPerMeeting"
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="participant-max-activities">
              Máximo de atividades por encontro
            </Label>

            <Input
              id="participant-max-activities"
              type="number"
              min={1}
              max={20}
              placeholder="Utilizar padrão"
              disabled={submitting}
              value={field.value ?? ""}
              onChange={(event) => {
                const value = event.target.value;

                field.onChange(value === "" ? null : Number(value));
              }}
            />

            <p className="text-xs text-muted-foreground">
              Deixe vazio para utilizar o limite padrão do sistema.
            </p>

            {errors.maxActivitiesPerMeeting && (
              <p className="text-xs text-destructive">
                {errors.maxActivitiesPerMeeting.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Ações */}
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={onCancel}
          className="h-12 rounded-full"
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          disabled={submitting}
          className="h-12 rounded-full"
        >
          {submitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}

          {participant ? "Salvar alterações" : "Cadastrar participante"}
        </Button>
      </div>
    </form>
  );
}
