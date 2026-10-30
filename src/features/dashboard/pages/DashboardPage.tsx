import { useEffect, useMemo, useState } from "react";

import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { Participant } from "@/features/participants/types/participant.types";
import type { Activity } from "@/features/activities/types/activity.types";
import type { MeetingSchedule } from "@/features/schedules/types/schedule.types";
import type { SavedMonthlySchedule } from "@/features/schedules/types/schedule-persistence.types";
import { activityRepository } from "@/features/activities/services/activity.repository";
import { participantRepository } from "@/features/participants/services/participant.repository";
import { scheduleRepository } from "@/features/schedules/services/schedule.repository";

interface DashboardData {
  participants: Participant[];
  activities: Activity[];
  schedules: SavedMonthlySchedule[];
}

const EMPTY_DATA: DashboardData = {
  participants: [],
  activities: [],
  schedules: [],
};

function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(parseLocalDate(date));
}

function getNextThursday(from: Date): string {
  const date = new Date(from);

  date.setHours(0, 0, 0, 0);

  const daysUntilThursday = (4 - date.getDay() + 7) % 7;

  date.setDate(date.getDate() + daysUntilThursday);

  return getLocalDateString(date);
}

function getMeetingForDate(
  schedules: SavedMonthlySchedule[],
  date: string,
): MeetingSchedule | null {
  const [year, month] = date.split("-").map(Number);

  const schedule = schedules.find(
    (item) => item.year === year && item.month === month,
  );

  return schedule?.meetings.find((meeting) => meeting.date === date) ?? null;
}

function buildMeetingText(
  meeting: MeetingSchedule,
  activities: Activity[],
  participants: Participant[],
): string {
  const activityMap = new Map(
    activities.map((activity) => [activity.id, activity]),
  );

  const participantMap = new Map(
    participants.map((participant) => [participant.id, participant]),
  );

  const grouped = new Map<string, string[]>();

  for (const assignment of meeting.assignments) {
    const participant = participantMap.get(assignment.participantId);

    const participantName = participant?.name ?? "Participante não encontrado";

    const names = grouped.get(assignment.activityId) ?? [];

    names.push(participantName);

    grouped.set(assignment.activityId, names);
  }

  const lines = [
    "🏡 *LAR — ESCALA DA SEMANA*",
    "",
    `📅 ${formatDate(meeting.date)}`,
    "",
  ];

  const orderedActivities = [...activities]
    .filter((activity) => grouped.has(activity.id))
    .sort((a, b) => a.order - b.order);

  for (const activity of orderedActivities) {
    const names = grouped.get(activity.id) ?? [];

    lines.push(`*${activity.name}*`);

    for (const name of names) {
      lines.push(`• ${name}`);
    }

    lines.push("");
  }

  const unknownActivities = [...grouped.entries()].filter(
    ([activityId]) => !activityMap.has(activityId),
  );

  for (const [, names] of unknownActivities) {
    lines.push("*Atividade não encontrada*");

    for (const name of names) {
      lines.push(`• ${name}`);
    }

    lines.push("");
  }

  lines.push("💚 Que seja um encontro abençoado!");

  return lines.join("\n");
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayString = getLocalDateString(today);

  const nextThursday = useMemo(() => getNextThursday(today), [today]);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [participants, activities, schedules] = await Promise.all([
        participantRepository.findAll(),
        activityRepository.findAll(),
        scheduleRepository.findAll(),
      ]);

      setData({
        participants,
        activities,
        schedules,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const activeParticipants = useMemo(
    () => data.participants.filter((participant) => participant.active),
    [data.participants],
  );

  const futureMeetings = useMemo(() => {
    return data.schedules
      .flatMap((schedule) => schedule.meetings)
      .filter((meeting) => meeting.date >= todayString)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data.schedules, todayString]);

  const nextMeeting = useMemo(
    () => getMeetingForDate(data.schedules, nextThursday),
    [data.schedules, nextThursday],
  );

  const participantMap = useMemo(
    () =>
      new Map(
        data.participants.map((participant) => [participant.id, participant]),
      ),
    [data.participants],
  );

  const nextMeetingActivities = useMemo(() => {
    if (!nextMeeting) return [];

    return [...data.activities]
      .filter((activity) => {
        return nextMeeting.assignments.some(
          (assignment) => assignment.activityId === activity.id,
        );
      })
      .sort((a, b) => a.order - b.order)
      .map((activity) => ({
        activity,
        assignments: nextMeeting.assignments.filter(
          (assignment) => assignment.activityId === activity.id,
        ),
      }));
  }, [nextMeeting, data.activities]);

  const inactiveAssignments = useMemo(() => {
    if (!nextMeeting) return [];

    return nextMeeting.assignments.filter((assignment) => {
      const participant = participantMap.get(assignment.participantId);

      return participant?.active === false;
    });
  }, [nextMeeting, participantMap]);

  const currentMonthMeetings = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    return (
      data.schedules.find(
        (schedule) => schedule.year === year && schedule.month === month,
      )?.meetings ?? []
    );
  }, [data.schedules, today]);

  const remainingMeetings = currentMonthMeetings.filter(
    (meeting) => meeting.date >= todayString,
  ).length;

  const stats = [
    {
      title: "Encontros restantes",
      value: remainingMeetings,
      description: "Neste mês",
      icon: CalendarDays,
    },
    {
      title: "Participantes ativos",
      value: activeParticipants.length,
      description: `${data.participants.length} cadastrados`,
      icon: Users,
    },
    {
      title: "Meses com escala",
      value: data.schedules.length,
      description: "Programações salvas",
      icon: ClipboardList,
    },
  ];

  async function handleCopySchedule() {
    if (!nextMeeting) {
      toast.error("Não existe uma escala salva para esta quinta-feira.");
      return;
    }

    if (nextMeeting.assignments.length === 0) {
      toast.error("A escala ainda não possui responsáveis.");
      return;
    }

    if (inactiveAssignments.length > 0) {
      toast.warning(
        "A escala contém participantes inativos. Revise antes de compartilhar.",
      );

      return;
    }

    const text = buildMeetingText(
      nextMeeting,
      data.activities,
      data.participants,
    );

    try {
      setCopying(true);

      await navigator.clipboard.writeText(text);

      setCopied(true);

      toast.success("Escala copiada! Agora é só colar no WhatsApp.");

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      toast.error("Não foi possível copiar a escala.");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="space-y-7 pb-10">
      {/* CABEÇALHO */}

      <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-lar-dark-green">
            <Sparkles className="size-4" />
            Painel de organização
          </div>

          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Visão geral do LAR
          </h1>

          <p className="text-sm text-muted-foreground">
            Organize os encontros e acompanhe as próximas escalas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="rounded-full"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          <Button render={<Link to="/schedules" />} className="rounded-full">
            <CalendarDays className="size-4" />
            Gerenciar escalas
          </Button>
        </div>
      </section>

      {/* INDICADORES */}

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ title, value, description, icon: Icon }) => (
          <Card key={title} className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>

              <div className="rounded-xl bg-accent p-2">
                <Icon className="size-5 text-accent-foreground" />
              </div>
            </CardHeader>

            <CardContent>
              <p className="font-heading text-3xl font-semibold">
                {loading ? "—" : value}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* PRÓXIMA QUINTA-FEIRA */}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <Card className="overflow-hidden rounded-3xl">
          <CardHeader className="border-b border-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-lar-dark-green">
                  Próximo encontro
                </p>

                <CardTitle className="font-heading text-xl">
                  {formatDate(nextThursday)}
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Escala da próxima quinta-feira
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                render={<Link to="/schedules" />}
                className="rounded-full"
              >
                Ver escala
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <LoaderCircle className="size-5 animate-spin" />
                Carregando escala...
              </div>
            ) : !nextMeeting ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CalendarDays className="size-9 text-muted-foreground" />

                <h3 className="font-semibold">
                  Nenhuma escala salva para esta quinta-feira
                </h3>

                <p className="max-w-sm text-sm text-muted-foreground">
                  Gere ou salve a programação do mês para visualizar os
                  responsáveis aqui.
                </p>

                <Button render={<Link to="/schedules" />}>
                  <Sparkles className="size-4" />
                  Gerar escala
                </Button>
              </div>
            ) : (
              <>
                {inactiveAssignments.length > 0 && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />

                    <div>
                      <p className="text-sm font-semibold">Atenção à escala</p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Existem {inactiveAssignments.length} atribuição(ões) com
                        participantes inativos. Revise antes de compartilhar.
                      </p>
                    </div>
                  </div>
                )}

                {nextMeetingActivities.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum responsável atribuído.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {nextMeetingActivities.map(({ activity, assignments }) => (
                      <div
                        key={activity.id}
                        className="rounded-2xl border border-border p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="font-medium">{activity.name}</p>

                          <span className="text-xs text-muted-foreground">
                            {assignments.length}/{activity.requiredParticipants}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {assignments.map((assignment) => {
                            const participant = participantMap.get(
                              assignment.participantId,
                            );

                            const inactive = participant?.active === false;

                            return (
                              <span
                                key={assignment.id}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                                  inactive
                                    ? "bg-amber-500/15 text-amber-700"
                                    : "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                {participant?.name ??
                                  "Participante não encontrado"}

                                {inactive && " · Inativo"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  className="h-12 w-full rounded-xl font-semibold"
                  onClick={() => void handleCopySchedule()}
                  disabled={
                    copying ||
                    nextMeeting.assignments.length === 0 ||
                    inactiveAssignments.length > 0
                  }
                >
                  {copying ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}

                  {copied ? "Escala copiada!" : "Copiar escala da semana"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Copie a programação e compartilhe no grupo do WhatsApp.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* ACESSOS RÁPIDOS */}

        <div className="space-y-5">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Acesso rápido
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {[
                {
                  title: "Gerenciar participantes",
                  description: "Cadastros e disponibilidades",
                  to: "/participants",
                  icon: Users,
                },
                {
                  title: "Configurar atividades",
                  description: "Funções e responsáveis",
                  to: "/activities",
                  icon: ActivityIcon,
                },
                {
                  title: "Organizar escalas",
                  description: "Gerar, editar e compartilhar",
                  to: "/schedules",
                  icon: CalendarDays,
                },
              ].map(({ title, description, to, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary"
                >
                  <div className="rounded-lg bg-accent p-2">
                    <Icon className="size-4 text-accent-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{title}</p>

                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>

                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Próximos encontros
              </CardTitle>
            </CardHeader>

            <CardContent>
              {futureMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum encontro futuro com escala salva.
                </p>
              ) : (
                <div className="space-y-3">
                  {futureMeetings.slice(0, 4).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatDate(meeting.date)}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {meeting.assignments.length} atribuição(ões)
                        </p>
                      </div>

                      <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                        Salva
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
