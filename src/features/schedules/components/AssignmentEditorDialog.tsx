import { useMemo, useState } from "react";

import { Check, LockKeyhole, Search, UserRound } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { Activity } from "@/features/activities/types/activity.types";
import type { Participant } from "@/features/participants/types/participant.types";

import type {
  MeetingSchedule,
  ScheduleAssignment,
} from "../types/schedule.types";

import {
  ScheduleEditError,
  validateAssignment,
  type ScheduleEditContext,
} from "../engine/schedule-editor";

interface AssignmentEditorDialogProps {
  open: boolean;
  date: string;
  activity: Activity;
  assignment?: ScheduleAssignment;

  meetings: MeetingSchedule[];
  activities: Activity[];
  participants: Participant[];

  defaultMaxActivitiesPerMeeting: number;

  onClose: () => void;
  onConfirm: (participantId: string, locked: boolean) => void;
}

export function AssignmentEditorDialog({
  open,
  date,
  activity,
  assignment,
  meetings,
  activities,
  participants,
  defaultMaxActivitiesPerMeeting,
  onClose,
  onConfirm,
}: AssignmentEditorDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(assignment?.participantId ?? "");
  const [locked, setLocked] = useState(true);

  const context: ScheduleEditContext = {
    meetings,
    activities,
    participants,
    defaultMaxActivitiesPerMeeting,
  };

  const candidates = useMemo(() => {
    const normalizedSearch = search
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    return participants
      .filter((participant) =>
        participant.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(normalizedSearch),
      )
      .map((participant) => {
        try {
          validateAssignment(context, {
            date,
            activityId: activity.id,
            participantId: participant.id,
            replaceAssignmentId: assignment?.id,
          });

          return {
            participant,
            eligible: true,
            reason: "",
          };
        } catch (error) {
          return {
            participant,
            eligible: false,
            reason:
              error instanceof ScheduleEditError
                ? error.message
                : "Não é possível selecionar essa pessoa.",
          };
        }
      })
      .sort((a, b) => {
        if (a.eligible !== b.eligible) {
          return a.eligible ? -1 : 1;
        }

        return a.participant.name.localeCompare(b.participant.name, "pt-BR");
      });
  }, [
    search,
    participants,
    meetings,
    activities,
    defaultMaxActivitiesPerMeeting,
    date,
    activity.id,
    assignment?.id,
  ]);

  const selectedCandidate = candidates.find(
    ({ participant }) => participant.id === selectedId,
  );

  const canConfirm = selectedCandidate?.eligible === true;

  if (!open) return null;

  function handleConfirm() {
    if (!selectedId) {
      toast.error("Selecione um participante.");
      return;
    }

    try {
      validateAssignment(context, {
        date,
        activityId: activity.id,
        participantId: selectedId,
        replaceAssignmentId: assignment?.id,
      });

      onConfirm(selectedId, locked);
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o responsável.",
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-editor-title"
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-card shadow-xl"
      >
        <header className="border-b border-border p-5">
          <h2
            id="assignment-editor-title"
            className="font-heading text-xl font-semibold"
          >
            {assignment ? "Alterar responsável" : "Adicionar responsável"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {activity.name} · {date}
          </p>
        </header>

        <div className="space-y-4 overflow-y-auto p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar participante..."
              className="h-11 pl-10"
            />
          </div>

          <div className="space-y-2">
            {candidates.map(({ participant, eligible, reason }) => {
              const selected = selectedId === participant.id;
              const isInactive = !participant.active;

              return (
                <button
                  key={participant.id}
                  type="button"
                  disabled={!eligible}
                  onClick={() => setSelectedId(participant.id)}
                  className={`
        flex w-full items-center gap-3 rounded-xl border
        p-3 text-left transition-colors
        ${
          selected && eligible
            ? "border-lar-green bg-accent"
            : isInactive
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-border"
        }
        ${eligible ? "hover:bg-secondary" : "cursor-not-allowed opacity-60"}
      `}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <UserRound className="size-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{participant.name}</p>

                      {isInactive && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Inativo
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {eligible ? "Disponível para esta atividade" : reason}
                    </p>
                  </div>

                  {selected && eligible && (
                    <Check className="size-5 text-lar-dark-green" />
                  )}
                </button>
              );
            })}

            {candidates.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum participante encontrado.
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-secondary p-4">
            <input
              type="checkbox"
              checked={locked}
              onChange={(event) => setLocked(event.target.checked)}
              className="size-4 accent-lime-600"
            />

            <LockKeyhole className="size-4" />

            <span className="text-sm">
              Fixar esta escolha nas próximas gerações
            </span>
          </label>
        </div>

        <footer className="flex justify-end gap-3 border-t border-border p-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="button" disabled={!canConfirm} onClick={handleConfirm}>
            Confirmar responsável
          </Button>
        </footer>
      </div>
    </div>
  );
}
