import { useState } from "react";
import { Plus, UsersRound, UserCheck, UserX, LoaderCircle } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActivities } from "@/features/activities/hooks/useActivities";
import { DEFAULT_ACTIVITIES } from "@/constants/activities";

import { useParticipants } from "../hooks/useParticipants";

import type { Participant } from "../types/participant.types";
import type { ParticipantFormValues } from "../schemas/participant.schema";

import { ParticipantCard } from "../components/ParticipantCard";
import { ParticipantDrawer } from "../components/ParticipantDrawer";
import { ParticipantSearch } from "../components/ParticipantSearch";
import { ParticipantEmptyState } from "../components/ParticipantEmptyState";
import { ParticipantDeleteDialog } from "../components/ParticipantDeleteDialog";


import { scheduleRepository } from "@/features/schedules/services/schedule.repository";

import { getParticipantFutureAssignments } from "@/features/schedules/utils/schedule-conflicts.utils";

import { ParticipantDeactivateDialog } from "../components/ParticipantDeactivateDialog";

type StatusFilter = "all" | "active" | "inactive";

export function ParticipantsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);

  const [participantToDeactivate, setParticipantToDeactivate] =
    useState<Participant | null>(null);

  const [deactivationLoading, setDeactivationLoading] = useState(false);

  const [futureAssignmentsCount, setFutureAssignmentsCount] = useState(0);

  const [affectedMeetingsCount, setAffectedMeetingsCount] = useState(0);

  const [participantToDelete, setParticipantToDelete] =
    useState<Participant | null>(null);

  const { activities } = useActivities();

  const {
    participants,
    total,
    activeCount,
    loading,
    saving,
    error,
    createParticipant,
    updateParticipant,
    deleteParticipant,
  } = useParticipants(search);

  async function getFutureAssignments(participantId: string) {
    const today = new Date();

    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() + index, 1);

      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      };
    });

    const savedMonths = await Promise.all(
      months.map(({ year, month }) =>
        scheduleRepository.findByMonth(year, month),
      ),
    );

    const meetings = savedMonths.flatMap(
      (savedMonth) => savedMonth?.meetings ?? [],
    );

    return getParticipantFutureAssignments({
      participantId,
      meetings,
      fromDate: todayString,
    });
  }

  const inactiveCount = total - activeCount;

  const filteredParticipants = participants.filter((participant) => {
    if (statusFilter === "active") {
      return participant.active;
    }

    if (statusFilter === "inactive") {
      return !participant.active;
    }

    return true;
  });

  function handleCreate() {
    setSelectedParticipant(null);
    setDrawerOpen(true);
  }

  function handleEdit(participant: Participant) {
    setSelectedParticipant(participant);
    setDrawerOpen(true);
  }

  function handleCloseDrawer() {
    if (saving) return;

    setDrawerOpen(false);
    setSelectedParticipant(null);
  }

  async function handleSubmit(values: ParticipantFormValues) {
    try {
      if (selectedParticipant) {
        await updateParticipant(selectedParticipant.id, values);

        toast.success("Participante atualizado com sucesso.");
      } else {
        await createParticipant(values);

        toast.success("Participante cadastrado com sucesso.");
      }

      handleCloseDrawer();
    } catch {
      toast.error("Não foi possível salvar o participante.");
    }
  }

  async function handleToggleActive(participant: Participant) {
    if (participant.active) {
      setDeactivationLoading(true);

      try {
        const assignments = await getFutureAssignments(participant.id);

        setFutureAssignmentsCount(assignments.length);

        setAffectedMeetingsCount(
          new Set(assignments.map((assignment) => assignment.meetingId)).size,
        );

        setParticipantToDeactivate(participant);
      } catch {
        toast.error(
          "Não foi possível consultar as escalas futuras. Nenhuma alteração foi realizada.",
        );
      } finally {
        setDeactivationLoading(false);
      }

      return;
    }

    try {
      await updateParticipant(participant.id, {
        active: true,
      });

      toast.success("Participante reativado com sucesso.");
    } catch {
      toast.error("Não foi possível reativar o participante.");
    }
  }

  async function handleConfirmDeactivation() {
    if (!participantToDeactivate || saving) return;

    try {
      await updateParticipant(participantToDeactivate.id, {
        active: false,
      });

      toast.success("Participante desativado.", {
        description:
          futureAssignmentsCount > 0
            ? `${futureAssignmentsCount} atribuição(ões) futura(s) precisam de revisão.`
            : "O histórico foi preservado.",
      });

      setParticipantToDeactivate(null);
      setFutureAssignmentsCount(0);
      setAffectedMeetingsCount(0);
    } catch {
      toast.error("Não foi possível desativar o participante.");
    }
  }

  async function handleConfirmDelete() {
    if (!participantToDelete) return;

    try {
      await deleteParticipant(participantToDelete.id);

      toast.success("Participante excluído com sucesso.");

      setParticipantToDelete(null);
    } catch {
      toast.error("Não foi possível excluir o participante.");
    }
  }

  const filters: {
    label: string;
    value: StatusFilter;
    count: number;
  }[] = [
    {
      label: "Todos",
      value: "all",
      count: total,
    },
    {
      label: "Ativos",
      value: "active",
      count: activeCount,
    },
    {
      label: "Inativos",
      value: "inactive",
      count: inactiveCount,
    },
  ];

  return (
    <div className="space-y-7">
      {/* Cabeçalho */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Participantes
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Gerencie as pessoas que servem nos encontros do LAR.
          </p>
        </div>

        <Button
          onClick={handleCreate}
          disabled={saving}
          className="h-12 w-full rounded-full px-6 sm:w-auto"
        >
          <Plus className="size-4" />
          Novo participante
        </Button>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={total} icon={UsersRound} />

        <StatCard label="Ativos" value={activeCount} icon={UserCheck} />

        <div className="col-span-2 sm:col-span-1">
          <StatCard label="Inativos" value={inactiveCount} icon={UserX} />
        </div>
      </section>

      {/* Pesquisa e filtros */}
      <section className="space-y-4">
        <ParticipantSearch value={search} onChange={setSearch} />

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={statusFilter === filter.value ? "default" : "outline"}
              onClick={() => setStatusFilter(filter.value)}
              className="rounded-full"
            >
              {filter.label}

              <Badge variant="secondary" className="ml-1 rounded-full">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </section>

      {/* Erro de carregamento */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Conteúdo */}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <LoaderCircle className="size-7 animate-spin text-primary-foreground" />
          <span className="sr-only">Carregando participantes</span>
        </div>
      ) : filteredParticipants.length === 0 ? (
        <ParticipantEmptyState
          searching={
            search.trim().length > 0 || (statusFilter !== "all" && total > 0)
          }
          onCreate={handleCreate}
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredParticipants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              activities={activities}
              disabled={saving || deactivationLoading}
              onEdit={handleEdit}
              onDelete={setParticipantToDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </section>
      )}

      {/* Cadastro e edição */}
      <ParticipantDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDrawer();
          } else {
            setDrawerOpen(true);
          }
        }}
        participant={selectedParticipant}
        activities={DEFAULT_ACTIVITIES}
        loading={saving}
        onSubmit={handleSubmit}
      />

      {/* Exclusão */}
      <ParticipantDeleteDialog
        participant={participantToDelete}
        open={participantToDelete !== null}
        loading={saving}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setParticipantToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <ParticipantDeactivateDialog
        participant={participantToDeactivate}
        open={participantToDeactivate !== null}
        loading={saving}
        futureAssignmentsCount={futureAssignmentsCount}
        affectedMeetingsCount={affectedMeetingsCount}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setParticipantToDeactivate(null);
          }
        }}
        onConfirm={handleConfirmDeactivation}
      />
    </div>
  );
}

/* Componente interno dos indicadores */

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
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

      <p className="mt-4 font-heading text-3xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
