import {
  Pencil,
  LockKeyhole,
  LockKeyholeOpen,
  UserRoundPlus,
  Trash2,
  CalendarDays,
  RefreshCw,
  Share2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { MeetingSchedule } from "../types/schedule.types";

import type { Activity } from "@/features/activities/types/activity.types";

import type { Participant } from "@/features/participants/types/participant.types";

import { calculateActivityTimes } from "@/features/activities/utils/activity-time.utils";

import type { AssignmentSnapshot } from "../types/schedule-persistence.types";

interface MeetingScheduleCardProps {
  meeting: MeetingSchedule;
  activities: Activity[];
  participants: Participant[];
  snapshots?: AssignmentSnapshot[];
  meetingStartTime?: string;

  editable?: boolean;

  onShareMeeting?: (date: string) => void;
  onEditAssignment?: (
    date: string,
    activityId: string,
    assignmentId?: string,
  ) => void;

  onToggleLock?: (date: string, assignmentId: string) => void;

  onRemoveAssignment?: (date: string, assignmentId: string) => void;

  onRegenerateMeeting?: (date: string) => void;
}

export function MeetingScheduleCard({
  meeting,
  activities,
  participants,
  snapshots = [],
  meetingStartTime = "19:30",
  editable = false,
  onEditAssignment,
  onToggleLock,
  onRemoveAssignment,
  onRegenerateMeeting,
  onShareMeeting,
}: MeetingScheduleCardProps) {
  const activitiesWithTime = calculateActivityTimes(
    activities,
    meetingStartTime,
  );

  const participantNames = new Map(
    participants.map((participant) => [participant.id, participant.name]),
  );

  const participantMap = new Map(
    participants.map((participant) => [participant.id, participant]),
  );

  const today = new Date();

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const isFutureMeeting = meeting.date >= todayString;

  const inactiveAssignments = isFutureMeeting
    ? meeting.assignments.filter((assignment) => {
        const participant = participantMap.get(assignment.participantId);

        return participant?.active === false;
      })
    : [];

  const snapshotMap = new Map(
    snapshots.map((snapshot) => [snapshot.assignmentId, snapshot]),
  );

  const dateLabel = format(parseISO(meeting.date), "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  });

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      {/* ============================================== */}
      {/* CABEÇALHO DO ENCONTRO */}
      {/* ============================================== */}

      <header className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent">
            <CalendarDays className="size-5 text-accent-foreground" />
          </div>

          <div className="min-w-0">
            <h3 className="font-heading text-lg font-semibold capitalize">
              {dateLabel}
            </h3>

            <p className="text-xs text-muted-foreground">
              {meeting.assignments.length}{" "}
              {meeting.assignments.length === 1 ? "atribuição" : "atribuições"}
            </p>
          </div>

          {inactiveAssignments.length > 0 && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700"
            >
              <AlertTriangle className="size-4 shrink-0" />
              {inactiveAssignments.length}{" "}
              {inactiveAssignments.length === 1
                ? "responsável inativo"
                : "atribuições com responsáveis inativos"}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {editable && onRegenerateMeeting && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => onRegenerateMeeting(meeting.date)}
            >
              <RefreshCw className="size-4" />
              Regenerar encontro
            </Button>
          )}

          {onShareMeeting && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => onShareMeeting(meeting.date)}
            >
              <Share2 className="size-4" />
              Compartilhar
            </Button>
          )}
        </div>
      </header>

      {/* ============================================== */}
      {/* ATIVIDADES DO ENCONTRO */}
      {/* ============================================== */}

      <div className="divide-y divide-border">
        {activitiesWithTime.map((activity) => {
          const assignments = meeting.assignments.filter(
            (assignment) => assignment.activityId === activity.id,
          );

          const missing = Math.max(
            0,
            activity.requiredParticipants - assignments.length,
          );

          return (
            <div
              key={activity.id}
              className="grid gap-3 p-4 sm:grid-cols-[72px_1fr_1fr] sm:items-center"
            >
              {/* Horário */}

              <div className="text-sm font-semibold text-muted-foreground">
                {activity.startTime}
              </div>

              {/* Atividade */}

              <div>
                <p className="font-medium">{activity.name}</p>

                <p className="text-xs text-muted-foreground">
                  {activity.durationMinutes} min
                </p>
              </div>

              {/* Responsáveis */}

              <div className="flex flex-wrap items-center gap-2">
                {assignments.map((assignment) => {
                  const participantName =
                    snapshotMap.get(assignment.id)?.participantName ??
                    participantNames.get(assignment.participantId) ??
                    "Participante não encontrado";

                  const participant = participantMap.get(
                    assignment.participantId,
                  );

                  const isInactive =
                    isFutureMeeting && participant?.active === false;

                  return (
                    <div
                      key={assignment.id}
                      className={`flex max-w-full flex-wrap items-center gap-1 rounded-xl border p-1 ${
                        isInactive
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-border bg-secondary/50"
                      }`}
                    >
                      <span className="px-2 text-sm font-medium">
                        {participantName}

                        {isInactive && (
                          <span
                            title="Participante inativo. Revise esta atribuição."
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-700"
                          >
                            <AlertTriangle className="size-3" />
                            Inativo
                          </span>
                        )}
                      </span>

                      {editable ? (
                        <>
                          {/* Editar */}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Alterar responsável ${participantName}`}
                            title="Alterar responsável"
                            onClick={() =>
                              onEditAssignment?.(
                                meeting.date,
                                activity.id,
                                assignment.id,
                              )
                            }
                          >
                            <Pencil className="size-4" />
                          </Button>

                          {/* Fixar / desbloquear */}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={
                              assignment.locked
                                ? `Desbloquear ${participantName}`
                                : `Fixar ${participantName}`
                            }
                            title={
                              assignment.locked
                                ? "Desbloquear responsável"
                                : "Fixar responsável"
                            }
                            onClick={() =>
                              onToggleLock?.(meeting.date, assignment.id)
                            }
                          >
                            {assignment.locked ? (
                              <LockKeyhole className="size-4 text-lar-dark-green" />
                            ) : (
                              <LockKeyholeOpen className="size-4" />
                            )}
                          </Button>

                          {/* Remover */}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remover ${participantName}`}
                            title="Remover responsável"
                            onClick={() =>
                              onRemoveAssignment?.(meeting.date, assignment.id)
                            }
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        assignment.locked && (
                          <LockKeyhole
                            className="mr-2 size-3 text-muted-foreground"
                            aria-label="Responsável fixado"
                          />
                        )
                      )}
                    </div>
                  );
                })}

                {/* Vagas disponíveis */}

                {Array.from({ length: missing }, (_, index) => (
                  <div
                    key={`missing-${index}`}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-amber-500/40 px-3 py-2 text-sm text-amber-700"
                  >
                    <span>Sem responsável</span>

                    {editable && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onEditAssignment?.(meeting.date, activity.id)
                        }
                      >
                        <UserRoundPlus className="size-4" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
