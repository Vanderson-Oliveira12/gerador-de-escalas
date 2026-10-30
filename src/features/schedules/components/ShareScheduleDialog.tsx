import { useMemo, useRef, useState } from "react";

import { ScheduleImageTemplate } from "./ScheduleImageTemplate";

import {
  downloadScheduleImage,
  generateScheduleImage,
  shareScheduleImage,
} from "../utils/schedule-image.utils";

import {
  CalendarDays,
  Check,
  ClipboardCopy,
  Clock3,
  Download,
  MessageCircle,
  Share2,
  UserRound,
} from "lucide-react";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { Activity } from "@/features/activities/types/activity.types";
import type { Participant } from "@/features/participants/types/participant.types";

import { calculateActivityTimes } from "@/features/activities/utils/activity-time.utils";

import type { MeetingSchedule } from "../types/schedule.types";
import type { AssignmentSnapshot } from "../types/schedule-persistence.types";

import {
  buildScheduleShareMessage,
  copyScheduleMessage,
  openWhatsAppShare,
  type ScheduleShareScope,
} from "../utils/schedule-share.utils";

// ======================================================
// TYPES
// ======================================================

interface ShareScheduleDialogProps {
  open: boolean;
  scope: ScheduleShareScope;
  date?: string;

  meetings: MeetingSchedule[];
  activities: Activity[];
  participants: Participant[];

  snapshots?: AssignmentSnapshot[];
  meetingStartTime?: string;

  onClose: () => void;
}

interface SchedulePreviewProps {
  meetings: MeetingSchedule[];
  activities: Activity[];
  participants: Participant[];
  snapshots: AssignmentSnapshot[];
  meetingStartTime: string;
}

// ======================================================
// SCHEDULE PREVIEW
// ======================================================

function SchedulePreview({
  meetings,
  activities,
  participants,
  snapshots,
  meetingStartTime,
}: SchedulePreviewProps) {
  const activitiesWithTime = useMemo(
    () => calculateActivityTimes(activities, meetingStartTime),
    [activities, meetingStartTime],
  );

  const participantMap = useMemo(
    () =>
      new Map(
        participants.map((participant) => [participant.id, participant.name]),
      ),
    [participants],
  );

  const snapshotMap = useMemo(
    () =>
      new Map(snapshots.map((snapshot) => [snapshot.assignmentId, snapshot])),
    [snapshots],
  );

  const orderedMeetings = useMemo(
    () => [...meetings].sort((a, b) => a.date.localeCompare(b.date)),
    [meetings],
  );

  if (orderedMeetings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <CalendarDays className="mx-auto mb-3 size-8 text-muted-foreground" />

        <p className="text-sm font-medium">Nenhum encontro encontrado</p>

        <p className="mt-1 text-xs text-muted-foreground">
          Não há programação disponível para compartilhar.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        orderedMeetings.length > 1
          ? "grid grid-cols-1 items-start gap-5 lg:grid-cols-2"
          : "space-y-4"
      }
    >
      {orderedMeetings.map((meeting) => {
        const formattedDate = format(
          parseISO(meeting.date),
          "EEEE, dd 'de' MMMM 'de' yyyy",
          {
            locale: ptBR,
          },
        );

        const totalAssignments = meeting.assignments.length;

        return (
          <section
            key={meeting.date}
            className="w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
          >
            {/* ====================================== */}
            {/* MEETING HEADER */}
            {/* ====================================== */}

            <div className="border-b border-border bg-secondary/30 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <CalendarDays className="size-5 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Programação do encontro
                  </p>

                  <h3 className="mt-1 font-heading text-base font-semibold capitalize leading-snug text-foreground">
                    {formattedDate}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="size-3.5" />
                      Início às {meetingStartTime}
                    </span>

                    <span>
                      {totalAssignments}{" "}
                      {totalAssignments === 1 ? "atribuição" : "atribuições"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ====================================== */}
            {/* ACTIVITIES TIMELINE */}
            {/* ====================================== */}

            <div className="px-5 py-6 sm:px-8">
              {activitiesWithTime.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma atividade cadastrada.
                </p>
              ) : (
                <div>
                  {activitiesWithTime.map((activity, index) => {
                    const assignments = meeting.assignments.filter(
                      (assignment) => assignment.activityId === activity.id,
                    );

                    const names = assignments.map(
                      (assignment) =>
                        snapshotMap.get(assignment.id)?.participantName ??
                        participantMap.get(assignment.participantId) ??
                        "Participante não encontrado",
                    );

                    const missing = Math.max(
                      0,
                      activity.requiredParticipants - assignments.length,
                    );

                    const responsibleNames = [
                      ...names,
                      ...Array.from({ length: missing }, () => "A definir"),
                    ];

                    const isLast = index === activitiesWithTime.length - 1;

                    return (
                      <div
                        key={activity.id}
                        className="grid grid-cols-[54px_18px_minmax(0,1fr)] gap-4"
                      >
                        {/* TIME */}

                        <div className="pt-0.5 text-right">
                          <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                            {activity.startTime}
                          </span>
                        </div>

                        {/* TIMELINE */}

                        <div className="flex flex-col items-center">
                          <span className="mt-1 size-2.5 shrink-0 rounded-full border-[2.5px] border-primary bg-background" />

                          {!isLast && (
                            <span className="mt-1 min-h-6 w-px flex-1 bg-border" />
                          )}
                        </div>

                        {/* CONTENT */}

                        <div className={isLast ? "min-w-0" : "min-w-0 pb-6"}>
                          <p className="text-sm font-semibold leading-5 text-foreground">
                            {activity.name}
                          </p>

                          <div className="mt-2 flex items-start gap-2">
                            <UserRound className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />

                            <div className="flex min-w-0 flex-wrap gap-1.5">
                              {responsibleNames.length > 0 ? (
                                responsibleNames.map((name, nameIndex) => {
                                  const isPending = name === "A definir";

                                  return (
                                    <span
                                      key={`${activity.id}-${nameIndex}`}
                                      className={[
                                        "inline-flex max-w-full items-center rounded-lg px-2 py-1 text-xs font-medium",
                                        isPending
                                          ? "bg-amber-500/10 text-amber-700"
                                          : "bg-secondary text-secondary-foreground",
                                      ].join(" ")}
                                    >
                                      <span className="break-words">
                                        {name}
                                      </span>
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Sem responsável
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ======================================================
// SHARE SCHEDULE DIALOG
// ======================================================

export function ShareScheduleDialog({
  open,
  scope,
  date,
  meetings,
  activities,
  participants,
  snapshots = [],
  meetingStartTime = "19:30",
  onClose,
}: ShareScheduleDialogProps) {
  const [copied, setCopied] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const isMonthly = scope === "MONTH";

  // ====================================================
  // SELECTED MEETINGS
  // ====================================================

  const selectedMeetings = useMemo(() => {
    if (scope === "MEETING") {
      return meetings.filter((meeting) => meeting.date === date);
    }

    return meetings;
  }, [meetings, scope, date]);

  // ====================================================
  // BUILD SHARE MESSAGE
  // ====================================================

  const { message, error } = useMemo(() => {
    try {
      const generatedMessage = buildScheduleShareMessage({
        scope,
        date,
        meetings,
        activities,
        participants,
        snapshots,
        meetingStartTime,
      });

      return {
        message: generatedMessage,
        error: null,
      };
    } catch (err) {
      return {
        message: "",
        error:
          err instanceof Error
            ? err.message
            : "Não foi possível preparar a escala.",
      };
    }
  }, [
    scope,
    date,
    meetings,
    activities,
    participants,
    snapshots,
    meetingStartTime,
  ]);

  // ====================================================
  // ACTIONS
  // ====================================================

  async function handleCopy() {
    if (!message) {
      return;
    }

    try {
      await copyScheduleMessage(message);

      setCopied(true);

      toast.success("Escala copiada!", {
        description: "Agora você pode colar a programação onde desejar.",
      });
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  }

  function handleWhatsApp() {
    if (!message) {
      return;
    }

    openWhatsAppShare(message);
  }

  async function handleDownloadImage() {
    if (!imageRef.current || isGeneratingImage || error) {
      return;
    }

    setIsGeneratingImage(true);

    try {
      const filename =
        scope === "MONTH"
          ? "lar-escala-mensal"
          : `lar-encontro-${date ?? "programacao"}`;

      const file = await generateScheduleImage({
        element: imageRef.current,
        filename,
      });

      downloadScheduleImage(file);

      toast.success("Imagem gerada com sucesso!", {
        description: "A escala foi exportada em PNG.",
      });
    } catch (err) {
      console.error("Erro ao exportar escala:", err);

      toast.error("Não foi possível gerar a imagem.");
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function handleShareImage() {
    if (!imageRef.current || isGeneratingImage || error) {
      return;
    }

    setIsGeneratingImage(true);

    try {
      const filename =
        scope === "MONTH"
          ? "lar-escala-mensal"
          : `lar-encontro-${date ?? "programacao"}`;

      const file = await generateScheduleImage({
        element: imageRef.current,
        filename,
      });

      const result = await shareScheduleImage(file);

      if (result === "UNSUPPORTED") {
        downloadScheduleImage(file);

        toast.info("Imagem baixada!", {
          description:
            "Seu navegador não permite compartilhar arquivos diretamente. Envie o PNG pelo WhatsApp.",
        });

        return;
      }

      if (result === "SHARED") {
        toast.success("Compartilhamento concluído!");
      }
    } catch (err) {
      console.error("Erro ao compartilhar imagem:", err);

      toast.error("Não foi possível compartilhar a imagem.");
    } finally {
      setIsGeneratingImage(false);
    }
  }

  function handleClose() {
    setCopied(false);
    onClose();
  }

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
      <AlertDialogContent
        className="
    !flex
    !w-[calc(100vw-24px)]
    !max-w-[1100px]
    !h-[min(900px,94dvh)]
    !max-h-[94dvh]
    !flex-col
    !gap-0
    !overflow-hidden
    !rounded-3xl
    !p-0
    sm:!w-[94vw]
    sm:!max-w-[1100px]
    lg:!w-[85vw]
  "
      >
        {/* ========================================== */}
        {/* HEADER */}
        {/* ========================================== */}

        <AlertDialogHeader className="shrink-0 border-b border-border px-5 py-5 text-left sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-green-500/10">
              <MessageCircle className="size-5 text-green-600" />
            </div>

            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="font-heading text-lg font-semibold">
                {isMonthly
                  ? "Compartilhar escala mensal"
                  : "Compartilhar encontro"}
              </AlertDialogTitle>

              <AlertDialogDescription className="mt-1 text-sm leading-relaxed">
                {isMonthly
                  ? "Confira a programação do mês antes de compartilhar com os participantes."
                  : "Confira os responsáveis e horários antes de compartilhar a programação."}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* ========================================== */}
        {/* BODY */}
        {/* ========================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-secondary/20 px-4 py-6 sm:px-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Pré-visualização
              </h4>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {isMonthly
                  ? `${selectedMeetings.length} encontros selecionados`
                  : "Programação do encontro"}
              </p>
            </div>

            <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
              {message.length} caracteres
            </span>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive"
            >
              {error}
            </div>
          ) : (
            <SchedulePreview
              meetings={selectedMeetings}
              activities={activities}
              participants={participants}
              snapshots={snapshots}
              meetingStartTime={meetingStartTime}
            />
          )}

          {message.length > 3500 && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <p className="text-xs leading-relaxed text-amber-700">
                A mensagem é extensa. Caso o WhatsApp não consiga abri-la,
                utilize a opção Copiar texto.
              </p>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* FOOTER */}
        {/* ========================================== */}

        <AlertDialogFooter className="shrink-0 border-t border-border bg-card px-4 py-4 sm:px-6">
          <div className="flex w-full flex-col gap-3">
            {/* AÇÕES DE IMAGEM */}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={!message || isGeneratingImage}
                onClick={handleDownloadImage}
                className="h-11 w-full rounded-xl"
              >
                <Download className="size-4" />

                {isGeneratingImage ? "Gerando imagem..." : "Baixar imagem"}
              </Button>

              <Button
                type="button"
                disabled={!message || isGeneratingImage}
                onClick={handleShareImage}
                className="h-11 w-full rounded-xl bg-green-600 text-white hover:bg-green-700"
              >
                <Share2 className="size-4" />
                Compartilhar imagem
              </Button>
            </div>

            {/* COMPARTILHAMENTO POR TEXTO */}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={!message}
                onClick={handleCopy}
                className="h-10 w-full rounded-xl"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <ClipboardCopy className="size-4" />
                )}

                {copied ? "Texto copiado!" : "Copiar texto"}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={!message}
                onClick={handleWhatsApp}
                className="h-10 w-full rounded-xl"
              >
                <MessageCircle className="size-4" />
                WhatsApp (texto)
              </Button>
            </div>

            {/* FECHAR */}

            <AlertDialogCancel
              onClick={handleClose}
              className="h-10 w-full rounded-xl"
            >
              Fechar
            </AlertDialogCancel>
          </div>
        </AlertDialogFooter>

        {/* TEMPLATE EXCLUSIVO PARA EXPORTAÇÃO */}

        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            pointerEvents: "none",
          }}
        >
          <div ref={imageRef}>
            <ScheduleImageTemplate
              scope={scope}
              meetings={selectedMeetings}
              activities={activities}
              participants={participants}
              snapshots={snapshots}
              meetingStartTime={meetingStartTime}
            />
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
