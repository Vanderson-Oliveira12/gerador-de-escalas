import { AlertTriangle, LoaderCircle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";

import type { Participant } from "../types/participant.types";

interface ParticipantDeactivateDialogProps {
  participant: Participant | null;
  open: boolean;
  loading: boolean;
  futureAssignmentsCount: number;
  affectedMeetingsCount: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ParticipantDeactivateDialog({
  participant,
  open,
  loading,
  futureAssignmentsCount,
  affectedMeetingsCount,
  onOpenChange,
  onConfirm,
}: ParticipantDeactivateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-3xl">
        <AlertDialogHeader>
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-amber-500/10">
            <AlertTriangle className="size-6 text-amber-600" />
          </div>

          <AlertDialogTitle>Desativar participante?</AlertDialogTitle>

          <AlertDialogDescription className="leading-relaxed">
            <strong>{participant?.name}</strong> deixará de ser selecionado nas
            próximas gerações de escalas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {futureAssignmentsCount > 0 ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-foreground">
              Existem escalas que precisam de atenção
            </p>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Encontramos{" "}
              <strong>{futureAssignmentsCount} atribuição(ões)</strong> em{" "}
              <strong>{affectedMeetingsCount} encontro(s)</strong> futuro(s) no
              período consultado.
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              Essas atribuições serão preservadas e sinalizadas para revisão.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-secondary/40 p-4">
            <p className="text-sm text-muted-foreground">
              Nenhuma atribuição futura foi encontrada no período consultado.
            </p>
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          O histórico do participante não será excluído. Você poderá reativá-lo
          posteriormente.
        </p>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={loading} className="rounded-xl">
            Cancelar
          </AlertDialogCancel>

          <Button
            type="button"
            variant="destructive"
            disabled={loading || !participant}
            onClick={onConfirm}
            className="rounded-xl"
          >
            {loading && <LoaderCircle className="size-4 animate-spin" />}
            Confirmar desativação
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
