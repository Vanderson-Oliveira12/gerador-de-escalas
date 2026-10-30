import type { Activity } from "@/features/activities/types/activity.types";
import type { Participant } from "@/features/participants/types/participant.types";

import type {
  MeetingSchedule,
  ScheduleAssignment,
} from "../types/schedule.types";
import { generateId } from "@/shared/utils/id.utils";

export type ScheduleEditErrorCode =
  | "MEETING_NOT_FOUND"
  | "ACTIVITY_NOT_FOUND"
  | "ACTIVITY_INACTIVE"
  | "PARTICIPANT_NOT_FOUND"
  | "PARTICIPANT_INACTIVE"
  | "ACTIVITY_NOT_ALLOWED"
  | "PARTICIPANT_UNAVAILABLE"
  | "PARTICIPANT_LIMIT_REACHED"
  | "DUPLICATE_ASSIGNMENT"
  | "ACTIVITY_FULL"
  | "ASSIGNMENT_NOT_FOUND";

export class ScheduleEditError extends Error {
  public readonly code: ScheduleEditErrorCode;

  constructor(code: ScheduleEditErrorCode, message: string) {
    super(message);

    this.name = "ScheduleEditError";
    this.code = code;
  }
}

export interface ScheduleEditContext {
  meetings: MeetingSchedule[];
  activities: Activity[];
  participants: Participant[];
  defaultMaxActivitiesPerMeeting: number;
}

export interface AssignParticipantInput {
  date: string;
  activityId: string;
  participantId: string;

  // Ao substituir, informe a atribuição que será removida.
  replaceAssignmentId?: string;

  // Escolhas manuais ficam fixadas por padrão.
  locked?: boolean;
}

function fail(code: ScheduleEditErrorCode, message: string): never {
  throw new ScheduleEditError(code, message);
}

function findMeeting(
  meetings: MeetingSchedule[],
  date: string,
): MeetingSchedule {
  const meeting = meetings.find((item) => item.date === date);

  if (!meeting) {
    return fail("MEETING_NOT_FOUND", "Encontro não encontrado.");
  }

  return meeting;
}

function findAssignment(
  meeting: MeetingSchedule,
  assignmentId: string,
): ScheduleAssignment {
  const assignment = meeting.assignments.find(
    (item) => item.id === assignmentId,
  );

  if (!assignment) {
    return fail(
      "ASSIGNMENT_NOT_FOUND",
      "Responsável não encontrado nessa escala.",
    );
  }

  return assignment;
}

function replaceMeeting(
  meetings: MeetingSchedule[],
  updated: MeetingSchedule,
): MeetingSchedule[] {
  return meetings.map((meeting) =>
    meeting.id === updated.id ? updated : meeting,
  );
}

export function validateAssignment(
  context: ScheduleEditContext,
  input: AssignParticipantInput,
): void {
  const { meetings, activities, participants, defaultMaxActivitiesPerMeeting } =
    context;

  const meeting = findMeeting(meetings, input.date);

  if (input.replaceAssignmentId) {
    const previousAssignment = findAssignment(
      meeting,
      input.replaceAssignmentId,
    );

    if (previousAssignment.activityId !== input.activityId) {
      fail(
        "ASSIGNMENT_NOT_FOUND",
        "A atribuição não pertence à atividade selecionada.",
      );
    }
  }

  const activity = activities.find((item) => item.id === input.activityId);

  if (!activity) {
    fail("ACTIVITY_NOT_FOUND", "Atividade não encontrada.");
  }

  if (!activity.active) {
    fail("ACTIVITY_INACTIVE", "Essa atividade está desativada.");
  }

  const participant = participants.find(
    (item) => item.id === input.participantId,
  );

  if (!participant) {
    fail("PARTICIPANT_NOT_FOUND", "Participante não encontrado.");
  }

  if (!participant.active) {
    fail("PARTICIPANT_INACTIVE", "Esse participante está inativo.");
  }

  if (!participant.allowedActivityIds.includes(activity.id)) {
    fail(
      "ACTIVITY_NOT_ALLOWED",
      "Esse participante não está habilitado para a atividade.",
    );
  }

  if (participant.unavailableDates.includes(input.date)) {
    fail(
      "PARTICIPANT_UNAVAILABLE",
      "Esse participante está indisponível nessa data.",
    );
  }

  // A substituição deve desconsiderar a atribuição antiga.
  const remainingAssignments = meeting.assignments.filter(
    (assignment) => assignment.id !== input.replaceAssignmentId,
  );

  const activityAssignments = remainingAssignments.filter(
    (assignment) => assignment.activityId === activity.id,
  );

  if (activityAssignments.length >= activity.requiredParticipants) {
    fail("ACTIVITY_FULL", "Essa atividade já possui todos os responsáveis.");
  }

  const duplicate = activityAssignments.some(
    (assignment) => assignment.participantId === participant.id,
  );

  if (duplicate) {
    fail("DUPLICATE_ASSIGNMENT", "Essa pessoa já está nessa atividade.");
  }

  const participantAssignments = remainingAssignments.filter(
    (assignment) => assignment.participantId === participant.id,
  );

  const limit =
    participant.maxActivitiesPerMeeting ?? defaultMaxActivitiesPerMeeting;

  if (participantAssignments.length >= limit) {
    fail(
      "PARTICIPANT_LIMIT_REACHED",
      `Essa pessoa já atingiu o limite de ${limit} atividade(s) neste encontro.`,
    );
  }
}

export function assignParticipant(
  context: ScheduleEditContext,
  input: AssignParticipantInput,
): MeetingSchedule[] {
  const meeting = findMeeting(context.meetings, input.date);

  if (input.replaceAssignmentId) {
    const previous = findAssignment(meeting, input.replaceAssignmentId);

    if (previous.activityId !== input.activityId) {
      fail(
        "ASSIGNMENT_NOT_FOUND",
        "A atribuição não pertence à atividade selecionada.",
      );
    }
  }

  validateAssignment(context, input);

  const previous = input.replaceAssignmentId
    ? findAssignment(meeting, input.replaceAssignmentId)
    : null;

  const assignment: ScheduleAssignment = {
    id: previous?.id ?? generateId(),
    activityId: input.activityId,
    participantId: input.participantId,
    locked: input.locked ?? true,
  };

  const assignments = previous
    ? meeting.assignments.map((item) =>
        item.id === previous.id ? assignment : item,
      )
    : [...meeting.assignments, assignment];

  return replaceMeeting(context.meetings, {
    ...meeting,
    assignments,
  });
}

export function removeAssignment(
  meetings: MeetingSchedule[],
  date: string,
  assignmentId: string,
): MeetingSchedule[] {
  const meeting = findMeeting(meetings, date);

  findAssignment(meeting, assignmentId);

  return replaceMeeting(meetings, {
    ...meeting,
    assignments: meeting.assignments.filter((item) => item.id !== assignmentId),
  });
}

export function toggleAssignmentLock(
  meetings: MeetingSchedule[],
  date: string,
  assignmentId: string,
): MeetingSchedule[] {
  const meeting = findMeeting(meetings, date);

  findAssignment(meeting, assignmentId);

  return replaceMeeting(meetings, {
    ...meeting,
    assignments: meeting.assignments.map((assignment) =>
      assignment.id === assignmentId
        ? { ...assignment, locked: !assignment.locked }
        : assignment,
    ),
  });
}
