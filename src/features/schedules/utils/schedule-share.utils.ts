import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { Activity } from "@/features/activities/types/activity.types";
import type { Participant } from "@/features/participants/types/participant.types";

import { calculateActivityTimes } from "@/features/activities/utils/activity-time.utils";

import type { MeetingSchedule } from "../types/schedule.types";
import type { AssignmentSnapshot } from "../types/schedule-persistence.types";

export interface ScheduleShareData {
  meetings: MeetingSchedule[];
  activities: Activity[];
  participants: Participant[];
  snapshots?: AssignmentSnapshot[];
  meetingStartTime?: string;
}

type MeetingShareData = Omit<ScheduleShareData, "meetings">;
export type ScheduleShareScope = "MEETING" | "MONTH";

export interface ScheduleShareOptions extends ScheduleShareData {
  scope: ScheduleShareScope;
  date?: string;
}

export function formatMeetingDate(date: string): string {
  return format(parseISO(date), "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
}

export function formatMonthLabel(date: string): string {
  return format(parseISO(date), "MMMM 'de' yyyy", {
    locale: ptBR,
  });
}

function getParticipantName(
  participantId: string,
  assignmentId: string,
  participants: Participant[],
  snapshots: AssignmentSnapshot[],
): string {
  const snapshot = snapshots.find((item) => item.assignmentId === assignmentId);

  if (snapshot?.participantName) {
    return snapshot.participantName;
  }

  const participant = participants.find((item) => item.id === participantId);

  return participant?.name ?? "Participante não encontrado";
}

function formatMeeting(
  meeting: MeetingSchedule,
  data: MeetingShareData,
): string {
  const {
    activities,
    participants,
    snapshots = [],
    meetingStartTime = "19:30",
  } = data;

  const activitiesWithTime = calculateActivityTimes(
    activities,
    meetingStartTime,
  );

  const lines: string[] = [
    `*${formatMeetingDate(meeting.date)}*`,
    `Início: ${meetingStartTime}`,
    "",
  ];

  for (const activity of activitiesWithTime) {
    const assignments = meeting.assignments.filter(
      (assignment) => assignment.activityId === activity.id,
    );

    const names = assignments.map((assignment) =>
      getParticipantName(
        assignment.participantId,
        assignment.id,
        participants,
        snapshots,
      ),
    );

    const missing = Math.max(
      0,
      activity.requiredParticipants - assignments.length,
    );

    const responsibleNames = [
      ...names,
      ...Array.from({ length: missing }, () => "A definir"),
    ];

    const responsibleText =
      responsibleNames.length > 0
        ? responsibleNames.join(", ")
        : "Sem responsável";

    lines.push(
      `*${activity.startTime} | ${activity.name}*`,
      `Responsável${responsibleNames.length > 1 ? "is" : ""}: ${responsibleText}`,
      "",
    );
  }

  return lines.join("\n").trim();
}

export function buildScheduleShareMessage({
  scope,
  date,
  meetings,
  activities,
  participants,
  snapshots = [],
  meetingStartTime = "19:30",
}: ScheduleShareOptions): string {
  if (meetings.length === 0) {
    throw new Error("Não existem encontros para compartilhar.");
  }

  const orderedMeetings = [...meetings].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const selectedMeetings =
    scope === "MEETING"
      ? orderedMeetings.filter((meeting) => meeting.date === date)
      : orderedMeetings;

  if (selectedMeetings.length === 0) {
    throw new Error("Encontro não encontrado.");
  }

  const title =
    scope === "MEETING"
      ? "*LAR | PROGRAMAÇÃO DO ENCONTRO*"
      : "*LAR | ESCALA MENSAL*";

  const lines: string[] = [title, ""];

  if (scope === "MONTH") {
    lines.push(`📆 *${formatMonthLabel(selectedMeetings[0].date)}*`, "");
  }

  selectedMeetings.forEach((meeting, index) => {
    if (index > 0) {
      lines.push("────────────────────", "");
    }

    lines.push(
      formatMeeting(meeting, {
        activities,
        participants,
        snapshots,
        meetingStartTime,
      }),
      "",
    );
  });

  lines.push("Que Deus abençoe nossos encontros!");

  return lines.join("\n").trim();
}

export function getWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppShare(message: string): void {
  const url = getWhatsAppShareUrl(message);

  const link = document.createElement("a");

  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function copyScheduleMessage(message: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("A cópia automática não está disponível neste navegador.");
  }

  await navigator.clipboard.writeText(message);
}
