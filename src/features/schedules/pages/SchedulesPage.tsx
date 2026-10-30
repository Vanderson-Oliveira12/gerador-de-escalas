import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  CalendarDays,
  Check,
  CircleAlert,
  ClipboardList,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Save,
  Share2,
  Trash2,
} from "lucide-react";
import { RegenerateMeetingDialog } from "../components/RegenerateMeetingDialog";
import { getInactiveParticipantConflicts } from "../utils/schedule-conflicts.utils";
import type { RegenerateMeetingResult } from "../engine/meeting-regenerator";

import { toast } from "sonner";

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

import { activityRepository } from "@/features/activities/services/activity.repository";

import { participantRepository } from "@/features/participants/services/participant.repository";

import type { Activity } from "@/features/activities/types/activity.types";

import type { Participant } from "@/features/participants/types/participant.types";

import {
  ScheduleGenerationForm,
  type GenerationSettings,
} from "../components/ScheduleGenerationForm";

import { ScheduleSummary } from "../components/ScheduleSummary";

import { MeetingScheduleCard } from "../components/MeetingScheduleCard";

import { ScheduleIssues } from "../components/ScheduleIssues";

import { AssignmentEditorDialog } from "../components/AssignmentEditorDialog";

import { useSchedules } from "../hooks/useSchedules";

import type {
  MeetingSchedule,
  ScheduleAssignment,
} from "../types/schedule.types";

import {
  assignParticipant,
  removeAssignment,
  toggleAssignmentLock,
} from "../engine/schedule-editor";

import { scheduleRepository } from "../services/schedule.repository";
import type { ScheduleShareScope } from "../utils/schedule-share.utils";
import { ShareScheduleDialog } from "../components/ShareScheduleDialog";

// ======================================================
// CONSTANTES
// ======================================================

const currentDate = new Date();

const INITIAL_SETTINGS: GenerationSettings = {
  year: currentDate.getFullYear(),
  month: currentDate.getMonth() + 1,
  mode: "BALANCED",
  defaultMaxActivitiesPerMeeting: 2,
  preserveLockedAssignments: true,
};

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// ======================================================
// TYPES
// ======================================================

interface EditingAssignment {
  date: string;
  activityId: string;
  assignmentId?: string;
}

interface PendingRemoval {
  date: string;
  assignmentId: string;
  participantName: string;
}

type PendingAction =
  | {
      type: "CHANGE_SETTINGS";
      settings: GenerationSettings;
    }
  | {
      type: "GENERATE";
    }
  | {
      type: "DISCARD_PREVIEW";
    }
  | null;

// ======================================================
// HELPERS
// ======================================================

function getMonthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} de ${year}`;
}

function getErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado.",
) {
  return error instanceof Error ? error.message : fallback;
}

function findAssignment(
  meetings: MeetingSchedule[],
  assignmentId: string,
): ScheduleAssignment | undefined {
  for (const meeting of meetings) {
    const assignment = meeting.assignments.find(
      (item) => item.id === assignmentId,
    );

    if (assignment) {
      return assignment;
    }
  }

  return undefined;
}

function getAssignmentsCount(meetings: MeetingSchedule[]) {
  return meetings.reduce(
    (total, meeting) => total + meeting.assignments.length,
    0,
  );
}

// ======================================================
// PAGE
// ======================================================

export function SchedulesPage() {
  // ----------------------------------------------------
  // ESTADOS
  // ----------------------------------------------------

  const [settings, setSettings] =
    useState<GenerationSettings>(INITIAL_SETTINGS);

  const [shareDialog, setShareDialog] = useState<{
    scope: ScheduleShareScope;
    date?: string;
  } | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);

  const [activities, setActivities] = useState<Activity[]>([]);

  const [generating, setGenerating] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [dataError, setDataError] = useState<string | null>(null);

  const [draftMeetings, setDraftMeetings] = useState<MeetingSchedule[] | null>(
    null,
  );

  const [regeneratingDate, setRegeneratingDate] = useState<string | null>(null);

  const [editingAssignment, setEditingAssignment] =
    useState<EditingAssignment | null>(null);

  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(
    null,
  );

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const [savingEdits, setSavingEdits] = useState(false);

  function handleShareMeeting(date: string) {
    setShareDialog({
      scope: "MEETING",
      date,
    });
  }

  function handleShareMonth() {
    setShareDialog({
      scope: "MONTH",
    });
  }

  // ----------------------------------------------------
  // SCHEDULE HOOK
  // ----------------------------------------------------

  const {
    savedMonth,
    preview,
    loading,
    saving,
    error,
    loadMonth,
    generateMonth,
    confirmMonth,
    discardPreview,
  } = useSchedules();

  // ----------------------------------------------------
  // DERIVED STATES
  // ----------------------------------------------------

  const isBusy = loading || saving || generating || savingEdits;

  const isPreview = preview !== null;

  const hasPendingEdits = draftMeetings !== null;

  const canEdit = !isPreview && savedMonth !== null && !isBusy;

  const displayMeetings = useMemo(() => {
    if (preview) {
      return preview.schedules;
    }

    if (draftMeetings) {
      return draftMeetings;
    }

    return savedMonth?.meetings ?? [];
  }, [preview, draftMeetings, savedMonth]);

  const inactiveConflicts = useMemo(() => {
    const today = new Date();

    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    return getInactiveParticipantConflicts({
      meetings: displayMeetings,
      participants,
      fromDate: todayString,
    });
  }, [displayMeetings, participants]);

  const currentMonthLabel = useMemo(
    () => getMonthLabel(settings.year, settings.month),
    [settings.year, settings.month],
  );

  const participantNames = useMemo(
    () =>
      new Map(
        participants.map((participant) => [participant.id, participant.name]),
      ),
    [participants],
  );

  const activityNames = useMemo(
    () => new Map(activities.map((activity) => [activity.id, activity.name])),
    [activities],
  );

  const originalAssignments = useMemo(() => {
    const map = new Map<string, ScheduleAssignment>();

    for (const meeting of savedMonth?.meetings ?? []) {
      for (const assignment of meeting.assignments) {
        map.set(assignment.id, assignment);
      }
    }

    return map;
  }, [savedMonth]);

  const originalSnapshots = useMemo(() => {
    return new Map(
      (savedMonth?.snapshots ?? []).map((snapshot) => [
        snapshot.assignmentId,
        snapshot,
      ]),
    );
  }, [savedMonth]);

  const assignmentCount = useMemo(
    () => getAssignmentsCount(displayMeetings),
    [displayMeetings],
  );

  const participantCount = useMemo(() => {
    const unique = new Set<string>();

    for (const meeting of displayMeetings) {
      for (const assignment of meeting.assignments) {
        unique.add(assignment.participantId);
      }
    }

    return unique.size;
  }, [displayMeetings]);

  const selectedActivity = useMemo(() => {
    if (!editingAssignment) {
      return null;
    }

    return (
      activities.find(
        (activity) => activity.id === editingAssignment.activityId,
      ) ?? null
    );
  }, [editingAssignment, activities]);

  const selectedAssignment = useMemo(() => {
    if (!editingAssignment?.assignmentId) {
      return undefined;
    }

    const meeting = displayMeetings.find(
      (item) => item.date === editingAssignment.date,
    );

    return meeting?.assignments.find(
      (assignment) => assignment.id === editingAssignment.assignmentId,
    );
  }, [editingAssignment, displayMeetings]);

  // ----------------------------------------------------
  // CARREGAMENTO INICIAL
  // ----------------------------------------------------

  useEffect(() => {
    void loadMonth(settings.year, settings.month);
  }, [settings.year, settings.month, loadMonth]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [people, availableActivities] = await Promise.all([
          participantRepository.findAll(),
          activityRepository.findAll(),
        ]);

        if (cancelled) {
          return;
        }

        setParticipants(people);
        setActivities(availableActivities);
        setDataError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setDataError(
          getErrorMessage(
            error,
            "Não foi possível carregar participantes e atividades.",
          ),
        );
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------------
  // HELPERS DE EDIÇÃO
  // ----------------------------------------------------

  function getEditableMeetings(): MeetingSchedule[] {
    if (!canEdit || !savedMonth) {
      throw new Error("A escala não está disponível para edição.");
    }

    return draftMeetings ?? savedMonth.meetings;
  }

  function handleApplyRegeneration(result: RegenerateMeetingResult) {
    if (!canEdit) {
      return;
    }

    setDraftMeetings(result.meetings);
    setRegeneratingDate(null);

    toast.success("Encontro reorganizado!", {
      description: "Confira as alterações e salve a escala mensal.",
    });

    if (result.summary.unfilledPositions > 0) {
      toast.warning(
        `${result.summary.unfilledPositions} vaga(s) ainda pendente(s).`,
      );
    }
  }

  function getParticipantName(assignment: ScheduleAssignment) {
    const original = originalAssignments.get(assignment.id);

    const snapshot = originalSnapshots.get(assignment.id);

    // Preserva o nome histórico somente quando
    // o participante continua sendo o mesmo.
    if (
      original?.participantId === assignment.participantId &&
      snapshot?.participantName
    ) {
      return snapshot.participantName;
    }

    return (
      participantNames.get(assignment.participantId) ??
      "Participante não encontrado"
    );
  }

  // ----------------------------------------------------
  // ALTERAR RESPONSÁVEL
  // ----------------------------------------------------

  function handleAssignParticipant(participantId: string, locked: boolean) {
    if (!editingAssignment || !canEdit || !savedMonth) {
      return;
    }

    const selectedParticipant = participants.find(
      (participant) => participant.id === participantId,
    );

    if (!selectedParticipant) {
      toast.error("Participante não encontrado.");
      return;
    }

    if (!selectedParticipant.active) {
      toast.error("Não é possível escalar um participante inativo.");
      return;
    }

    try {
      const updated = assignParticipant(
        {
          meetings: getEditableMeetings(),
          activities,
          participants,
          defaultMaxActivitiesPerMeeting:
            savedMonth.defaultMaxActivitiesPerMeeting,
        },
        {
          date: editingAssignment.date,
          activityId: editingAssignment.activityId,
          participantId,
          replaceAssignmentId: editingAssignment.assignmentId,
          locked,
        },
      );

      setDraftMeetings(updated);
      setEditingAssignment(null);

      toast.success(
        editingAssignment.assignmentId
          ? "Responsável alterado. Salve para confirmar."
          : "Responsável adicionado. Salve para confirmar.",
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível alterar o responsável."),
      );
    }
  }

  // ----------------------------------------------------
  // FIXAR / DESBLOQUEAR
  // ----------------------------------------------------

  function handleToggleAssignmentLock(date: string, assignmentId: string) {
    if (!canEdit) {
      return;
    }

    try {
      const meetings = getEditableMeetings();

      const currentAssignment = findAssignment(meetings, assignmentId);

      const updated = toggleAssignmentLock(meetings, date, assignmentId);

      setDraftMeetings(updated);

      toast.success(
        currentAssignment?.locked
          ? "Responsável desbloqueado."
          : "Responsável fixado.",
        {
          description: "Lembre-se de salvar as alterações.",
        },
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível alterar o bloqueio."),
      );
    }
  }

  // ----------------------------------------------------
  // SOLICITAR REMOÇÃO
  // ----------------------------------------------------

  function handleRequestRemoveAssignment(date: string, assignmentId: string) {
    if (!canEdit) {
      return;
    }

    const assignment = findAssignment(getEditableMeetings(), assignmentId);

    if (!assignment) {
      toast.error("Responsável não encontrado.");
      return;
    }

    setPendingRemoval({
      date,
      assignmentId,
      participantName: getParticipantName(assignment),
    });
  }

  // ----------------------------------------------------
  // CONFIRMAR REMOÇÃO
  // ----------------------------------------------------

  function handleConfirmRemoveAssignment() {
    if (!pendingRemoval || !canEdit) {
      return;
    }

    try {
      const updated = removeAssignment(
        getEditableMeetings(),
        pendingRemoval.date,
        pendingRemoval.assignmentId,
      );

      setDraftMeetings(updated);
      setPendingRemoval(null);

      toast.success("Responsável removido da escala.", {
        description: "A alteração ainda precisa ser salva.",
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível remover o responsável."),
      );
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function refreshParticipants() {
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        const people = await participantRepository.findAll();

        if (!cancelled) {
          setParticipants(people);
        }
      } catch {
        if (!cancelled) {
          toast.error("Não foi possível atualizar os participantes.");
        }
      }
    }

    function handleVisibilityChange() {
      void refreshParticipants();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // ----------------------------------------------------
  // DESCARTAR EDIÇÕES
  // ----------------------------------------------------

  function handleDiscardEdits() {
    setDraftMeetings(null);
    setEditingAssignment(null);
    setPendingRemoval(null);

    toast.info("Alterações descartadas.");
  }

  // ----------------------------------------------------
  // SALVAR EDIÇÕES
  // ----------------------------------------------------

  async function handleSaveEdits() {
    if (!savedMonth || !draftMeetings || isBusy || preview) {
      return;
    }

    setSavingEdits(true);

    try {
      // Evita sobrescrever uma alteração detectável
      // feita anteriormente em outra aba.
      const latest = await scheduleRepository.findByMonth(
        savedMonth.year,
        savedMonth.month,
      );

      if (!latest || latest.updatedAt !== savedMonth.updatedAt) {
        throw new Error(
          "Esta escala foi modificada em outro lugar. Atualize a página antes de salvar.",
        );
      }

      // Preserva snapshots antigos quando a atribuição
      // não mudou de participante ou atividade.
      const snapshots = draftMeetings.flatMap((meeting) =>
        meeting.assignments.map((assignment) => {
          const previousAssignment = originalAssignments.get(assignment.id);

          const previousSnapshot = originalSnapshots.get(assignment.id);

          const sameParticipant =
            previousAssignment?.participantId === assignment.participantId;

          const sameActivity =
            previousAssignment?.activityId === assignment.activityId;

          const participantName = sameParticipant
            ? (previousSnapshot?.participantName ??
              participantNames.get(assignment.participantId) ??
              "Participante não encontrado")
            : (participantNames.get(assignment.participantId) ??
              "Participante não encontrado");

          const activityName = sameActivity
            ? (previousSnapshot?.activityName ??
              activityNames.get(assignment.activityId) ??
              "Atividade não encontrada")
            : (activityNames.get(assignment.activityId) ??
              "Atividade não encontrada");

          return {
            assignmentId: assignment.id,
            participantName,
            activityName,
          };
        }),
      );

      await scheduleRepository.saveMonth({
        year: savedMonth.year,
        month: savedMonth.month,
        mode: savedMonth.mode,
        defaultMaxActivitiesPerMeeting:
          savedMonth.defaultMaxActivitiesPerMeeting,
        meetings: draftMeetings,
        snapshots,
      });

      await loadMonth(savedMonth.year, savedMonth.month);

      setDraftMeetings(null);
      setEditingAssignment(null);

      toast.success("Escala atualizada com sucesso!", {
        description: "Todas as alterações foram salvas.",
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível salvar as alterações."),
      );
    } finally {
      setSavingEdits(false);
    }
  }

  // ----------------------------------------------------
  // GERAÇÃO MENSAL
  // ----------------------------------------------------

  async function handleGenerate() {
    if (isBusy) {
      return;
    }

    if (
      !Number.isInteger(settings.year) ||
      settings.year < 2000 ||
      settings.year > 2100 ||
      !Number.isInteger(settings.month) ||
      settings.month < 1 ||
      settings.month > 12 ||
      !Number.isInteger(settings.defaultMaxActivitiesPerMeeting) ||
      settings.defaultMaxActivitiesPerMeeting < 1 ||
      settings.defaultMaxActivitiesPerMeeting > 20
    ) {
      toast.error("Confira o mês, o ano e o limite de atividades.");

      return;
    }

    setGenerating(true);

    try {
      // Carrega os cadastros mais recentes.
      const [people, availableActivities] = await Promise.all([
        participantRepository.findAll(),
        activityRepository.findAll(),
      ]);

      setParticipants(people);
      setActivities(availableActivities);
      setDataError(null);

      const result = await generateMonth(settings);

      toast.success(`${result.stats.totalMeetings} encontro(s) gerado(s).`);

      if (result.stats.unfilledPositions > 0) {
        toast.warning(
          `${result.stats.unfilledPositions} vaga(s) pendente(s).`,
          {
            description: "Confira as atividades que precisam de responsáveis.",
          },
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível gerar as escalas."));
    } finally {
      setGenerating(false);
    }
  }

  // ----------------------------------------------------
  // SALVAR PRÉVIA
  // ----------------------------------------------------

  async function handleSave() {
    if (!preview || isBusy) {
      return;
    }

    try {
      await confirmMonth(settings);

      setConfirmOpen(false);
      setDraftMeetings(null);

      toast.success("Escalas do mês salvas com sucesso!");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Não foi possível salvar as escalas."),
      );
    }
  }

  // ----------------------------------------------------
  // CONFIGURAÇÕES
  // ----------------------------------------------------

  function handleSettingsChange(nextSettings: GenerationSettings) {
    if (isBusy) {
      return;
    }

    const periodChanged =
      nextSettings.year !== settings.year ||
      nextSettings.month !== settings.month;

    // Evita perder edições ao mudar de período.
    if (periodChanged && hasPendingEdits) {
      setPendingAction({
        type: "CHANGE_SETTINGS",
        settings: nextSettings,
      });

      return;
    }

    // Se a prévia existir, qualquer alteração de
    // configuração invalida o resultado anterior.
    if (preview) {
      discardPreview();
    }

    setSettings(nextSettings);
  }

  // ----------------------------------------------------
  // SOLICITAR GERAÇÃO
  // ----------------------------------------------------

  function handleRequestGenerate() {
    if (isBusy) {
      return;
    }

    if (hasPendingEdits) {
      setPendingAction({
        type: "GENERATE",
      });

      return;
    }

    void handleGenerate();
  }

  // ----------------------------------------------------
  // SOLICITAR DESCARTE DA PRÉVIA
  // ----------------------------------------------------

  function handleRequestDiscardPreview() {
    if (isBusy || !preview) {
      return;
    }

    setPendingAction({
      type: "DISCARD_PREVIEW",
    });
  }

  // ----------------------------------------------------
  // CONFIRMAR AÇÃO PENDENTE
  // ----------------------------------------------------

  function handleConfirmPendingAction() {
    const action = pendingAction;

    if (!action || isBusy) {
      return;
    }

    setPendingAction(null);

    switch (action.type) {
      case "CHANGE_SETTINGS": {
        setDraftMeetings(null);
        setEditingAssignment(null);

        if (preview) {
          discardPreview();
        }

        setSettings(action.settings);
        break;
      }

      case "GENERATE": {
        setDraftMeetings(null);
        setEditingAssignment(null);

        void handleGenerate();
        break;
      }

      case "DISCARD_PREVIEW": {
        discardPreview();
        break;
      }
    }
  }

  // ----------------------------------------------------
  // SNAPSHOTS PARA EXIBIÇÃO
  // ----------------------------------------------------

  function getMeetingSnapshots(meeting: MeetingSchedule) {
    if (!savedMonth || preview) {
      return [];
    }

    return savedMonth.snapshots.filter((snapshot) => {
      const currentAssignment = meeting.assignments.find(
        (assignment) => assignment.id === snapshot.assignmentId,
      );

      if (!currentAssignment) {
        return false;
      }

      const originalAssignment = originalAssignments.get(snapshot.assignmentId);

      // Se o responsável foi substituído, não utiliza
      // o snapshot com o nome antigo.
      return (
        originalAssignment?.participantId === currentAssignment.participantId &&
        originalAssignment?.activityId === currentAssignment.activityId
      );
    });
  }

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------

  return (
    <div className="space-y-7 pb-32">
      {/* ============================================== */}
      {/* CABEÇALHO */}
      {/* ============================================== */}

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Escalas
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Gere, organize e acompanhe os responsáveis pelos encontros do LAR.
            </p>
          </div>

          {hasPendingEdits && (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-700">
              <Pencil className="size-3.5" />
              Alterações não salvas
            </div>
          )}
        </div>
      </section>

      {/* ============================================== */}
      {/* CONFIGURAÇÃO */}
      {/* ============================================== */}

      <ScheduleGenerationForm
        value={settings}
        loading={isBusy}
        onChange={handleSettingsChange}
        onGenerate={handleRequestGenerate}
      />

      {/* ============================================== */}
      {/* ERROS */}
      {/* ============================================== */}

      {(error || dataError) && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" />

          <p>{error ?? dataError}</p>
        </div>
      )}

      {/* ============================================== */}
      {/* CARREGAMENTO */}
      {/* ============================================== */}

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-border bg-card py-14">
          <LoaderCircle className="size-5 animate-spin text-lar-green" />

          <span className="text-sm text-muted-foreground">
            Carregando escalas...
          </span>
        </div>
      )}

      {/* ============================================== */}
      {/* PRÉVIA GERADA */}
      {/* ============================================== */}

      {!loading && preview && (
        <section className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-lar-green bg-accent p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lar-green/20">
              <Check className="size-5 text-lar-dark-green" />
            </div>

            <div className="space-y-1">
              <p className="font-semibold">Prévia gerada com sucesso</p>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Confira a distribuição dos participantes antes de confirmar a
                escala de <strong>{currentMonthLabel}</strong>.
              </p>

              <p className="text-xs text-muted-foreground">
                Esta versão ainda não foi salva.
              </p>
            </div>
          </div>

          <ScheduleSummary result={preview} />

          <ScheduleIssues issues={preview.issues} />
        </section>
      )}

      {/* ============================================== */}
      {/* ESCALA SALVA */}
      {/* ============================================== */}

      {!loading && !preview && savedMonth && (
        <section className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent">
              <CalendarDays className="size-5 text-lar-dark-green" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">Escala salva</p>

                <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-lar-dark-green">
                  {currentMonthLabel}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Este mês já possui uma programação confirmada. Você pode alterar
                responsáveis, preencher vagas e fixar escolhas manualmente.
              </p>
            </div>
          </div>

          {/* Indicadores da escala salva */}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Encontros</p>

              <p className="mt-2 font-heading text-2xl font-semibold">
                {displayMeetings.length}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Atribuições</p>

              <p className="mt-2 font-heading text-2xl font-semibold">
                {assignmentCount}
              </p>
            </div>

            <div className="col-span-2 rounded-2xl border border-border bg-card p-4 sm:col-span-1">
              <p className="text-xs text-muted-foreground">Pessoas escaladas</p>

              <p className="mt-2 font-heading text-2xl font-semibold">
                {participantCount}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ============================================== */}
      {/* ALTERAÇÕES PENDENTES */}
      {/* ============================================== */}

      {!loading && hasPendingEdits && !preview && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
        >
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />

          <div className="space-y-1">
            <p className="text-sm font-semibold">
              Você possui alterações pendentes
            </p>

            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              As mudanças estão sendo exibidas na programação, mas ainda não
              foram salvas. Clique em <strong>Salvar alterações</strong> quando
              terminar.
            </p>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* PROGRAMAÇÃO MENSAL */}
      {/* ============================================== */}

      {!loading && displayMeetings.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold">
                Programação mensal
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {currentMonthLabel}
              </p>
            </div>

            {canEdit && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                <Pencil className="size-3.5" />
                Edição disponível
              </span>
            )}
          </div>

          {inactiveConflicts.length > 0 && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />

              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Existem atribuições que precisam de revisão
                </p>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  Encontramos{" "}
                  <strong>{inactiveConflicts.length} atribuição(ões)</strong>{" "}
                  com participantes inativos em encontros futuros.
                </p>

                <p className="text-xs text-muted-foreground">
                  As escalas foram preservadas. Você pode substituir os
                  responsáveis ou regenerar os encontros afetados.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {displayMeetings.map((meeting) => (
              <MeetingScheduleCard
                key={meeting.id}
                onShareMeeting={handleShareMeeting}
                meeting={meeting}
                activities={activities}
                participants={participants}
                snapshots={getMeetingSnapshots(meeting)}
                editable={canEdit}
                onRegenerateMeeting={(date) => {
                  if (!canEdit) {
                    return;
                  }

                  setRegeneratingDate(date);
                }}
                onEditAssignment={(date, activityId, assignmentId) => {
                  if (!canEdit) {
                    return;
                  }

                  setEditingAssignment({
                    date,
                    activityId,
                    assignmentId,
                  });
                }}
                onToggleLock={handleToggleAssignmentLock}
                onRemoveAssignment={handleRequestRemoveAssignment}
              />
            ))}
          </div>
        </section>
      )}

      {/* ============================================== */}
      {/* ESTADO VAZIO */}
      {/* ============================================== */}

      {!loading && displayMeetings.length === 0 && (
        <div className="rounded-3xl border border-border bg-card px-6 py-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-secondary">
            <ClipboardList className="size-8 text-muted-foreground" />
          </div>

          <h2 className="mt-5 font-heading text-xl font-semibold">
            Nenhuma escala encontrada
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Ainda não existe uma programação para {currentMonthLabel}. Configure
            a distribuição e clique em <strong>Gerar escala mensal</strong>.
          </p>
        </div>
      )}

      {/* ============================================== */}
      {/* AÇÕES DA PRÉVIA */}
      {/* ============================================== */}

      {preview && (
        <div className="sticky bottom-20 z-20 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg sm:bottom-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">
              Prévia pronta para confirmação
            </p>

            <p className="text-xs text-muted-foreground">
              Revise antes de salvar.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleRequestDiscardPreview}
              className="h-12 rounded-full"
            >
              <Trash2 className="size-4" />
              Descartar prévia
            </Button>

            <Button
              type="button"
              disabled={isBusy}
              onClick={() => setConfirmOpen(true)}
              className="h-12 rounded-full"
            >
              <Save className="size-4" />
              Salvar escalas do mês
            </Button>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* AÇÕES DAS EDIÇÕES */}
      {/* ============================================== */}

      {hasPendingEdits && !preview && (
        <div className="sticky bottom-20 z-20 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-card p-4 shadow-lg sm:bottom-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Pencil className="size-4 text-amber-600" />
            </div>

            <div>
              <p className="text-sm font-semibold">Alterações não salvas</p>

              <p className="text-xs text-muted-foreground">
                Confirme para atualizar a escala.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleDiscardEdits}
              className="h-12 rounded-full"
            >
              <RotateCcw className="size-4" />
              Descartar
            </Button>

            <Button
              type="button"
              disabled={isBusy}
              onClick={() => void handleSaveEdits()}
              className="h-12 rounded-full"
            >
              {savingEdits ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}

              {savingEdits ? "Salvando..." : "Salvar alterações"}
            </Button>

            {displayMeetings.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleShareMonth}
              >
                <Share2 className="size-4" />
                Compartilhar mês
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* CONFIRMAR SALVAMENTO DA PRÉVIA */}
      {/* ============================================== */}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setConfirmOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {savedMonth
                ? "Substituir escala existente?"
                : "Confirmar escala mensal?"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {savedMonth
                ? "Este mês já possui uma escala salva. A nova versão substituirá a programação anterior. As atribuições não preservadas poderão ser alteradas."
                : "A programação será salva neste dispositivo e ficará disponível para consulta e edição."}

              {preview && preview.stats.unfilledPositions > 0 && (
                <>
                  <br />
                  <br />
                  Existem{" "}
                  <strong>
                    {preview.stats.unfilledPositions} vaga(s) pendente(s)
                  </strong>
                  . Você poderá preenchê-las manualmente depois.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();

                void handleSave();
              }}
            >
              {saving ? "Salvando..." : "Confirmar e salvar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================== */}
      {/* CONFIRMAR REMOÇÃO DE RESPONSÁVEL */}
      {/* ============================================== */}

      <AlertDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemoval(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover responsável?</AlertDialogTitle>

            <AlertDialogDescription>
              Você deseja remover{" "}
              <strong>{pendingRemoval?.participantName}</strong> desta
              atividade?
              <br />
              <br />A vaga ficará disponível para outro participante. A
              alteração só será definitiva quando você salvar a escala.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();

                handleConfirmRemoveAssignment();
              }}
            >
              Remover responsável
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================== */}
      {/* CONFIRMAR DESCARTE / TROCA DE PERÍODO */}
      {/* ============================================== */}

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open && !isBusy) {
            setPendingAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "CHANGE_SETTINGS"
                ? "Trocar o período?"
                : pendingAction?.type === "GENERATE"
                  ? "Gerar uma nova escala?"
                  : "Descartar esta prévia?"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {pendingAction?.type === "CHANGE_SETTINGS"
                ? "Você possui alterações não salvas. Ao mudar de mês ou ano, essas alterações serão descartadas."
                : pendingAction?.type === "GENERATE"
                  ? "Você possui alterações não salvas. Ao gerar novamente, essas mudanças serão descartadas. A escala salva anteriormente continuará disponível até que você confirme a nova versão."
                  : "A prévia atual será descartada. Nenhuma alteração será feita na escala que já está salva."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              disabled={isBusy}
              onClick={(event) => {
                event.preventDefault();

                handleConfirmPendingAction();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================== */}
      {/* EDITOR DE RESPONSÁVEIS */}
      {/* ============================================== */}

      {editingAssignment &&
        savedMonth &&
        !preview &&
        selectedActivity &&
        canEdit && (
          <AssignmentEditorDialog
            key={[
              editingAssignment.date,
              editingAssignment.activityId,
              editingAssignment.assignmentId ?? "new",
            ].join("-")}
            open
            date={editingAssignment.date}
            activity={selectedActivity}
            assignment={selectedAssignment}
            meetings={displayMeetings}
            activities={activities}
            participants={participants}
            defaultMaxActivitiesPerMeeting={
              savedMonth.defaultMaxActivitiesPerMeeting
            }
            onClose={() => {
              setEditingAssignment(null);
            }}
            onConfirm={handleAssignParticipant}
          />
        )}

      {regeneratingDate && savedMonth && !preview && canEdit && (
        <RegenerateMeetingDialog
          key={regeneratingDate}
          open
          date={regeneratingDate}
          meetings={displayMeetings}
          activities={activities}
          participants={participants}
          defaultMaxActivitiesPerMeeting={
            savedMonth.defaultMaxActivitiesPerMeeting
          }
          onClose={() => {
            setRegeneratingDate(null);
          }}
          onApply={handleApplyRegeneration}
        />
      )}

      {shareDialog && (
        <ShareScheduleDialog
          key={`${shareDialog.scope}-${shareDialog.date ?? "month"}`}
          open
          scope={shareDialog.scope}
          date={shareDialog.date}
          meetings={displayMeetings}
          activities={activities}
          participants={participants}
          meetingStartTime="19:30"
          onClose={() => {
            setShareDialog(null);
          }}
        />
      )}
    </div>
  );
}
