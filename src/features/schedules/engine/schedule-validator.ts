import type { Participant } from "@/features/participants/types/participant.types";

import type { Activity } from "@/features/activities/types/activity.types";

import type {
  ScheduleAssignment,
  ScheduleIssue,
} from "../types/schedule.types";

interface ValidateLockedAssignmentsInput {
  date: string;
  assignments: ScheduleAssignment[];
  participants: Participant[];
  activities: Activity[];
  defaultMaxActivitiesPerMeeting: number;
}

export function validateLockedAssignments({
  date,
  assignments,
  participants,
  activities,
  defaultMaxActivitiesPerMeeting,
}: ValidateLockedAssignmentsInput): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];

  const participantMap = new Map(
    participants.map((participant) => [participant.id, participant]),
  );

  const activityMap = new Map(
    activities.map((activity) => [activity.id, activity]),
  );

  const assignmentPairs = new Set<string>();
  const participantCounts = new Map<string, number>();
  const activityCounts = new Map<string, number>();

  for (const assignment of assignments) {
    const participant = participantMap.get(assignment.participantId);

    const activity = activityMap.get(assignment.activityId);

    const pairKey = JSON.stringify([
      assignment.activityId,
      assignment.participantId,
    ]);

    if (assignmentPairs.has(pairKey)) {
      issues.push({
        code: "INVALID_LOCKED_ASSIGNMENT",
        date,
        activityId: assignment.activityId,
        message:
          "A mesma pessoa está atribuída mais de uma vez à mesma atividade.",
      });
    }

    assignmentPairs.add(pairKey);

    participantCounts.set(
      assignment.participantId,
      (participantCounts.get(assignment.participantId) ?? 0) + 1,
    );

    activityCounts.set(
      assignment.activityId,
      (activityCounts.get(assignment.activityId) ?? 0) + 1,
    );

    if (!participant || !activity) {
      issues.push({
        code: "INVALID_LOCKED_ASSIGNMENT",
        date,
        activityId: assignment.activityId,
        message:
          "Atribuição bloqueada referencia participante ou atividade inexistente.",
      });

      continue;
    }

    if (
      !participant.active ||
      !activity.active ||
      !participant.allowedActivityIds.includes(activity.id) ||
      participant.unavailableDates.includes(date)
    ) {
      issues.push({
        code: "INVALID_LOCKED_ASSIGNMENT",
        date,
        activityId: activity.id,
        message: `${participant.name} não está elegível para ${activity.name}.`,
      });
    }
  }

  for (const activity of activities) {
    const count = activityCounts.get(activity.id) ?? 0;

    if (count > activity.requiredParticipants) {
      issues.push({
        code: "EXCESS_LOCKED_ASSIGNMENTS",
        date,
        activityId: activity.id,
        message:
          `${activity.name} possui ${count} atribuições bloqueadas, ` +
          `mas permite apenas ${activity.requiredParticipants}.`,
      });
    }
  }

  for (const participant of participants) {
    const count = participantCounts.get(participant.id) ?? 0;

    const limit =
      participant.maxActivitiesPerMeeting ?? defaultMaxActivitiesPerMeeting;

    if (count > limit) {
      issues.push({
        code: "INVALID_LOCKED_ASSIGNMENT",
        date,
        activityId: "",
        message:
          `${participant.name} possui ${count} atribuições ` +
          `bloqueadas e ultrapassou seu limite de ${limit}.`,
      });
    }
  }

  return issues;
}
