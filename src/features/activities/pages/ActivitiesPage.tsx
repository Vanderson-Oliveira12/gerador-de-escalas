import { useMemo, useState } from "react";

import {
  Clock3,
  ListTodo,
  LoaderCircle,
  Plus,
  UsersRound,
  RotateCcw,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useActivities } from "../hooks/useActivities";

import type { Activity } from "../types/activity.types";
import type { ActivityFormValues } from "../schemas/activity.schema";

import { calculateActivityTimes } from "../utils/activity-time.utils";

import { ActivityCard } from "../components/ActivityCard";
import { ActivityDrawer } from "../components/ActivityDrawer";
import { ActivityDeleteDialog } from "../components/ActivityDeleteDialog";

export function ActivitiesPage() {
  const {
    activities,
    activeCount,
    loading,
    saving,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    resetActivities,
  } = useActivities();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );

  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(
    null,
  );

  const orderedActivities = useMemo(
    () => [...activities].sort((a, b) => a.order - b.order),
    [activities],
  );

  const activitiesWithTime = useMemo(
    () => calculateActivityTimes(activities, "19:30"),
    [activities],
  );

  async function handleResetActivities() {
    try {
      await resetActivities();

      toast.success("Programação padrão restaurada com sucesso.");

      setResetDialogOpen(false);
    } catch {
      toast.error("Não foi possível restaurar a programação.");
    }
  }

  const timeByActivityId = useMemo(
    () =>
      new Map(
        activitiesWithTime.map((activity) => [
          activity.id,
          {
            startTime: activity.startTime,
            endTime: activity.endTime,
          },
        ]),
      ),
    [activitiesWithTime],
  );

  const totalDuration = activitiesWithTime.reduce(
    (total, activity) => total + activity.durationMinutes,
    0,
  );

  const totalPositions = activitiesWithTime.reduce(
    (total, activity) => total + activity.requiredParticipants,
    0,
  );

  const nextOrder =
    Math.max(-1, ...activities.map((activity) => activity.order)) + 1;

  function handleCreate() {
    setSelectedActivity(null);
    setDrawerOpen(true);
  }

  function handleEdit(activity: Activity) {
    setSelectedActivity(activity);
    setDrawerOpen(true);
  }

  async function handleSubmit(values: ActivityFormValues) {
    try {
      if (selectedActivity) {
        await updateActivity(selectedActivity.id, values);
        toast.success("Atividade atualizada com sucesso.");
      } else {
        await createActivity(values);
        toast.success("Atividade cadastrada com sucesso.");
      }

      setDrawerOpen(false);
      setSelectedActivity(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a atividade.",
      );
    }
  }

  async function handleToggleActive(activity: Activity) {
    try {
      await updateActivity(activity.id, {
        active: !activity.active,
      });

      toast.success(
        activity.active ? "Atividade desativada." : "Atividade ativada.",
      );
    } catch {
      toast.error("Não foi possível alterar o status.");
    }
  }

  async function handleMove(activity: Activity, direction: -1 | 1) {
    const index = orderedActivities.findIndex(
      (item) => item.id === activity.id,
    );

    const targetIndex = index + direction;

    if (
      index === -1 ||
      targetIndex < 0 ||
      targetIndex >= orderedActivities.length
    ) {
      return;
    }

    const reordered = [...orderedActivities];

    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];

    try {
      await reorderActivities(reordered.map((item) => item.id));
    } catch {
      toast.error("Não foi possível alterar a ordem.");
    }
  }

  async function handleConfirmDelete() {
    if (!activityToDelete) return;

    try {
      await deleteActivity(activityToDelete.id);

      toast.success("Atividade excluída com sucesso.");
      setActivityToDelete(null);
    } catch {
      toast.error("Não foi possível excluir a atividade.");
    }
  }

  return (
    <div className="space-y-7">
      {/* Cabeçalho */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Atividades
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Organize os momentos e responsáveis pelos encontros.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setResetDialogOpen(true)}
            disabled={saving || loading}
            className="h-12 w-full rounded-full px-6 sm:w-auto"
          >
            <RotateCcw className="size-4" />
            Restaurar padrão
          </Button>

          <Button
            onClick={handleCreate}
            disabled={saving || loading}
            className="h-12 w-full rounded-full px-6 sm:w-auto"
          >
            <Plus className="size-4" />
            Nova atividade
          </Button>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Atividades ativas"
          value={activeCount}
          icon={ListTodo}
        />

        <StatCard
          label="Duração total"
          value={`${totalDuration} min`}
          icon={Clock3}
        />

        <div className="col-span-2 lg:col-span-1">
          <StatCard
            label="Vagas por encontro"
            value={totalPositions}
            icon={UsersRound}
          />
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <LoaderCircle className="size-7 animate-spin" />
        </div>
      ) : orderedActivities.length === 0 ? (
        <div className="rounded-3xl border bg-card p-10 text-center">
          <ListTodo className="mx-auto size-10 text-muted-foreground" />

          <h2 className="mt-4 font-heading text-xl font-semibold">
            Nenhuma atividade cadastrada
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre os momentos que farão parte dos encontros.
          </p>

          <Button onClick={handleCreate} className="mt-6 rounded-full">
            <Plus className="size-4" />
            Criar atividade
          </Button>
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {orderedActivities.map((activity, index) => {
            const time = timeByActivityId.get(activity.id);

            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                startTime={time?.startTime}
                endTime={time?.endTime}
                canMoveUp={index > 0}
                canMoveDown={index < orderedActivities.length - 1}
                disabled={saving}
                onEdit={handleEdit}
                onDelete={setActivityToDelete}
                onToggleActive={handleToggleActive}
                onMoveUp={(item) => void handleMove(item, -1)}
                onMoveDown={(item) => void handleMove(item, 1)}
              />
            );
          })}
        </section>
      )}

      {/* Cadastro / edição */}
      <ActivityDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (saving) return;

          setDrawerOpen(open);

          if (!open) {
            setSelectedActivity(null);
          }
        }}
        activity={selectedActivity}
        nextOrder={nextOrder}
        loading={saving}
        onSubmit={handleSubmit}
      />

      {/* Exclusão */}
      <ActivityDeleteDialog
        activity={activityToDelete}
        open={activityToDelete !== null}
        loading={saving}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setActivityToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <AlertDialog
        open={resetDialogOpen}
        onOpenChange={(open) => {
          if (!saving) setResetDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar programação padrão?</AlertDialogTitle>

            <AlertDialogDescription>
              Essa ação substituirá todas as atividades atuais pelas oito
              atividades originais do LAR.
              <br />
              <br />
              Atividades personalizadas serão removidas e alterações de duração,
              ordem e quantidade de responsáveis serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void handleResetActivities();
              }}
            >
              {saving ? "Restaurando..." : "Restaurar programação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>

        <div className="flex size-9 items-center justify-center rounded-xl bg-accent">
          <Icon className="size-4 text-accent-foreground" />
        </div>
      </div>

      <p className="mt-4 font-heading text-3xl font-semibold">{value}</p>
    </div>
  );
}
