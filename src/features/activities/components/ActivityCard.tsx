import {
  ArrowDown,
  ArrowUp,
  Clock3,
  Pencil,
  Trash2,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { Activity } from "../types/activity.types";

interface ActivityCardProps {
  activity: Activity;
  startTime?: string;
  endTime?: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onToggleActive: (activity: Activity) => void;
  onMoveUp: (activity: Activity) => void;
  onMoveDown: (activity: Activity) => void;
}

export function ActivityCard({
  activity,
  startTime,
  endTime,
  canMoveUp,
  canMoveDown,
  disabled = false,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
}: ActivityCardProps) {
  return (
    <Card className="gap-4 rounded-2xl border-border bg-card py-5 shadow-none">
      <CardContent className="space-y-4 px-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent font-heading font-semibold text-accent-foreground">
            {activity.order + 1}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-lg font-semibold">
              {activity.name}
            </h3>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={activity.active ? "secondary" : "outline"}>
                {activity.active ? "Ativa" : "Inativa"}
              </Badge>

              {startTime && endTime && (
                <Badge variant="outline">
                  {startTime} – {endTime}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-4" />
              Duração
            </div>

            <p className="mt-2 font-semibold">{activity.durationMinutes} min</p>
          </div>

          <div className="rounded-xl bg-secondary p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UsersRound className="size-4" />
              Responsáveis
            </div>

            <p className="mt-2 font-semibold">
              {activity.requiredParticipants}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={disabled || !canMoveUp}
            onClick={() => onMoveUp(activity)}
            aria-label={`Mover ${activity.name} para cima`}
          >
            <ArrowUp className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            disabled={disabled || !canMoveDown}
            onClick={() => onMoveDown(activity)}
            aria-label={`Mover ${activity.name} para baixo`}
          >
            <ArrowDown className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onEdit(activity)}
            className="ml-auto rounded-full"
          >
            <Pencil className="size-4" />
            Editar
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => onToggleActive(activity)}
            aria-label={
              activity.active
                ? `Desativar ${activity.name}`
                : `Ativar ${activity.name}`
            }
          >
            {activity.active ? "Desativar" : "Ativar"}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => onDelete(activity)}
            aria-label={`Excluir ${activity.name}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
