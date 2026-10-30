import {
  CalendarOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { Participant } from "../types/participant.types";
import type { ActivityOption } from "./ParticipantActivitySelector";

interface ParticipantCardProps {
  participant: Participant;
  activities: ActivityOption[];
  disabled?: boolean;
  onEdit: (participant: Participant) => void;
  onDelete: (participant: Participant) => void;
  onToggleActive: (participant: Participant) => void;
}

export function ParticipantCard({
  participant,
  activities,
  disabled = false,
  onEdit,
  onDelete,
  onToggleActive,
}: ParticipantCardProps) {
  const allowedActivities = activities.filter((activity) =>
    participant.allowedActivityIds.includes(activity.id),
  );

  const visibleActivities = allowedActivities.slice(0, 3);
  const remainingCount = allowedActivities.length - visibleActivities.length;

  return (
    <Card className="gap-4 rounded-2xl border-border bg-card py-5 shadow-none">
      <CardContent className="space-y-5 px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent">
              <UsersRound
                className="size-5 text-accent-foreground"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <h3 className="truncate font-heading text-lg font-semibold text-foreground">
                {participant.name}
              </h3>

              <p className="text-xs text-muted-foreground">
                {allowedActivities.length} atividades permitidas
              </p>
            </div>
          </div>

          <Badge variant={participant.active ? "secondary" : "outline"}>
            {participant.active ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Pode servir em
          </p>

          <div className="flex flex-wrap gap-2">
            {visibleActivities.map((activity) => (
              <Badge
                key={activity.id}
                variant="outline"
                className="rounded-full px-3 py-1"
              >
                {activity.name}
              </Badge>
            ))}

            {remainingCount > 0 && (
              <Badge variant="secondary" className="rounded-full">
                +{remainingCount}
              </Badge>
            )}

            {allowedActivities.length === 0 && (
              <span className="text-sm text-muted-foreground">
                Nenhuma atividade configurada
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <CalendarOff className="size-4" />

          <span>{participant.unavailableDates.length} indisponibilidades</span>

          <span aria-hidden="true">·</span>

          <span>Limite: {participant.maxActivitiesPerMeeting ?? "Padrão"}</span>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onEdit(participant)}
            className="flex-1 rounded-full"
          >
            <Pencil className="size-4" />
            Editar
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onToggleActive(participant)}
            className="rounded-full"
          >
            <MoreHorizontal className="size-4" />
            {participant.active ? "Desativar" : "Ativar"}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => onDelete(participant)}
            aria-label={`Excluir ${participant.name}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
