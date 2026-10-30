import type { Participant } from "@/features/participants/types/participant.types";

import type { Activity } from "@/features/activities/types/activity.types";

export interface EligibilityContext {
  participant: Participant;
  activity: Activity;
  date: string;

  currentMeetingAssignments: {
    participantId: string;
    activityId: string;
  }[];

  defaultMaxActivitiesPerMeeting: number;
}

export function isParticipantEligible({
  participant,
  activity,
  date,
  currentMeetingAssignments,
  defaultMaxActivitiesPerMeeting,
}: EligibilityContext): boolean {
  if (!participant.active) {
    return false;
  }

  if (!activity.active) {
    return false;
  }

  if (!participant.allowedActivityIds.includes(activity.id)) {
    return false;
  }

  if (participant.unavailableDates.includes(date)) {
    return false;
  }

  const currentWorkload = currentMeetingAssignments.filter(
    (assignment) => assignment.participantId === participant.id,
  ).length;

  const maxActivities =
    participant.maxActivitiesPerMeeting ?? defaultMaxActivitiesPerMeeting;

  if (currentWorkload >= maxActivities) {
    return false;
  }

  // Impede que a mesma pessoa ocupe duas vagas
  // da mesma atividade no mesmo encontro.
  const alreadyAssignedToActivity = currentMeetingAssignments.some(
    (assignment) =>
      assignment.participantId === participant.id &&
      assignment.activityId === activity.id,
  );

  if (alreadyAssignedToActivity) {
    return false;
  }

  return true;
}
