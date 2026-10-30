import { useMemo, useState } from "react";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

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

import type { Activity } from "@/features/activities/types/activity.types";
import type { Participant } from "@/features/participants/types/participant.types";
import type { MeetingSchedule } from "../types/schedule.types";

import {
  regenerateMeeting,
  type DistributionMode,
  type RegenerationMode,
  type RegenerateMeetingResult,
} from "../engine/meeting-regenerator";

interface RegenerateMeetingDialogProps {
  open: boolean;
  date: string;
  meetings: MeetingSchedule[];
  activities: Activity[];
  participants: Participant[];
  defaultMaxActivitiesPerMeeting: number;
  onClose: () => void;
  onApply: (result: RegenerateMeetingResult) => void;
}

export function RegenerateMeetingDialog({
  open,
  date,
  meetings,
  activities,
  participants,
  defaultMaxActivitiesPerMeeting,
  onClose,
  onApply,
}: RegenerateMeetingDialogProps) {
  const [mode, setMode] = useState<RegenerationMode>("FILL_EMPTY");

  const [distributionMode, setDistributionMode] =
    useState<DistributionMode>("BALANCED");

  const [result, setResult] = useState<RegenerateMeetingResult | null>(null);

  const [error, setError] = useState<string | null>(null);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${date}T12:00:00Z`));
  }, [date]);

  function handleGenerate() {
    try {
      setError(null);

      const generated = regenerateMeeting({
        meetings,
        activities,
        participants,
        date,
        mode,
        distributionMode,
        defaultMaxActivitiesPerMeeting,
      });

      setResult(generated);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível regenerar o encontro.",
      );
    }
  }

  function handleApply() {
    if (!result) {
      return;
    }

    onApply(result);
    onClose();
  }

  function handleClose() {
    setResult(null);
    setError(null);
    onClose();
  }

  const inactiveAssignments = useMemo(() => {
    const meeting = meetings.find((item) => item.date === date);

    if (!meeting) return [];

    const participantMap = new Map(
      participants.map((participant) => [participant.id, participant]),
    );

    return meeting.assignments.filter((assignment) => {
      const participant = participantMap.get(assignment.participantId);

      return participant?.active === false;
    });
  }, [meetings, participants, date]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5 text-lar-green" />
            Regenerar encontro
          </AlertDialogTitle>

          <AlertDialogDescription>
            Reorganize os responsáveis de <strong>{formattedDate}</strong> sem
            modificar as outras quintas-feiras.
          </AlertDialogDescription>

          {inactiveAssignments.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />

              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Participantes inativos neste encontro
                </p>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Existem {inactiveAssignments.length} atribuição(ões) com
                  participantes inativos.
                </p>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Revise o resultado da regeneração antes de aplicar. A
                  substituição desses responsáveis depende do modo selecionado e
                  das regras do gerador.
                </p>
              </div>
            </div>
          )}
        </AlertDialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <label htmlFor="regeneration-mode" className="text-sm font-medium">
              Como deseja regenerar?
            </label>

            <select
              id="regeneration-mode"
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as RegenerationMode);
                setResult(null);
              }}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="FILL_EMPTY">Preencher somente vagas</option>

              <option value="PRESERVE_LOCKED">
                Preservar responsáveis fixados
              </option>

              <option value="REDISTRIBUTE_ALL">Redistribuir tudo</option>
            </select>

            {mode === "FILL_EMPTY" && (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Este modo preserva todas as atribuições existentes, inclusive
                  as de participantes inativos. Para corrigir esses conflitos
                  automaticamente, selecione "Preservar responsáveis fixados" ou
                  "Redistribuir tudo".
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="distribution-mode" className="text-sm font-medium">
              Tipo de distribuição
            </label>

            <select
              id="distribution-mode"
              value={distributionMode}
              onChange={(event) => {
                setDistributionMode(event.target.value as DistributionMode);
                setResult(null);
              }}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="BALANCED">Equilibrada</option>

              <option value="RANDOM">Aleatória</option>
            </select>
          </div>

          {mode === "REDISTRIBUTE_ALL" && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />

              <p>
                Esta opção também substitui responsáveis que estavam fixados
                neste encontro.
              </p>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGenerate}
          >
            <RefreshCw className="size-4" />
            Gerar distribuição
          </Button>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {result && (
            <div className="space-y-3 rounded-2xl border border-border bg-secondary/40 p-4">
              <p className="text-sm font-semibold">Resultado da regeneração</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Preservadas</p>

                  <p className="text-xl font-semibold">
                    {result.summary.preservedAssignments}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Novas</p>

                  <p className="text-xl font-semibold">
                    {result.summary.newAssignments}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Removidas</p>

                  <p className="text-xl font-semibold">
                    {result.summary.removedAssignments}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Vagas pendentes</p>

                  <p className="text-xl font-semibold">
                    {result.summary.unfilledPositions}
                  </p>
                </div>
              </div>

              {result.summary.removedInactiveAssignments > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <strong>{result.summary.removedInactiveAssignments}</strong>{" "}
                    atribuição(ões) de participantes inativos foram removidas
                    nesta regeneração.
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                O resultado será aplicado à edição atual. Você ainda precisará
                salvar a escala mensal.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancelar</AlertDialogCancel>

          <AlertDialogAction
            disabled={!result}
            onClick={(event) => {
              event.preventDefault();
              handleApply();
            }}
          >
            Aplicar alterações
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
