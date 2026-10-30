import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  activitySchema,
  type ActivityFormValues,
} from "../schemas/activity.schema";

import type { Activity } from "../types/activity.types";

interface ActivityFormProps {
  activity?: Activity | null;
  nextOrder: number;
  loading?: boolean;
  onSubmit: (values: ActivityFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ActivityForm({
  activity,
  nextOrder,
  loading = false,
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: "",
      durationMinutes: 5,
      requiredParticipants: 1,
      order: nextOrder,
      active: true,
    },
  });

  useEffect(() => {
    reset({
      name: activity?.name ?? "",
      durationMinutes: activity?.durationMinutes ?? 5,
      requiredParticipants: activity?.requiredParticipants ?? 1,
      order: activity?.order ?? nextOrder,
      active: activity?.active ?? true,
    });
  }, [activity, nextOrder, reset]);

  const submitting = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="activity-name">Nome da atividade</Label>

        <Input
          id="activity-name"
          placeholder="Ex.: Louvor"
          disabled={submitting}
          aria-invalid={!!errors.name}
          {...register("name")}
        />

        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="activity-duration">Duração (min)</Label>

          <Input
            id="activity-duration"
            type="number"
            min={1}
            max={180}
            disabled={submitting}
            aria-invalid={!!errors.durationMinutes}
            {...register("durationMinutes", {
              valueAsNumber: true,
            })}
          />

          {errors.durationMinutes && (
            <p className="text-xs text-destructive">
              {errors.durationMinutes.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="activity-responsibles">Responsáveis</Label>

          <Input
            id="activity-responsibles"
            type="number"
            min={1}
            max={20}
            disabled={submitting}
            aria-invalid={!!errors.requiredParticipants}
            {...register("requiredParticipants", {
              valueAsNumber: true,
            })}
          />

          {errors.requiredParticipants && (
            <p className="text-xs text-destructive">
              {errors.requiredParticipants.message}
            </p>
          )}
        </div>
      </div>

      <Controller
        name="active"
        control={control}
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div>
              <Label htmlFor="activity-active">Atividade ativa</Label>

              <p className="mt-1 text-xs text-muted-foreground">
                Atividades inativas não entram nas novas escalas.
              </p>
            </div>

            <Switch
              id="activity-active"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={submitting}
            />
          </div>
        )}
      />

      <div className="rounded-2xl bg-secondary p-4">
        <p className="text-sm text-secondary-foreground">
          A posição da atividade será definida pela ordem da programação. Você
          poderá alterá-la na listagem.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
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

          {activity ? "Salvar alterações" : "Cadastrar atividade"}
        </Button>
      </div>
    </form>
  );
}
