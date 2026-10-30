import type { Activity } from "@/features/activities/types/activity.types";
import type { Participant } from "@/features/participants/types/participant.types";
import type {
  MeetingSchedule,
  ScheduleAssignment,
} from "../types/schedule.types";
import { generateId } from "@/shared/utils/id.utils";

export type RegenerationMode =
  | "FILL_EMPTY"
  | "PRESERVE_LOCKED"
  | "REDISTRIBUTE_ALL";

export type DistributionMode = "BALANCED" | "RANDOM";

export interface RegenerateMeetingInput {
  meetings: MeetingSchedule[];
  activities: Activity[];
  participants: Participant[];
  date: string;
  mode: RegenerationMode;
  distributionMode: DistributionMode;
  defaultMaxActivitiesPerMeeting: number;
}

export interface RegenerationSummary {
  preservedAssignments: number;
  newAssignments: number;
  removedAssignments: number;
  unfilledPositions: number;
  removedInactiveAssignments: number;
}

export interface RegenerateMeetingResult {
  meetings: MeetingSchedule[];
  summary: RegenerationSummary;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function isUnavailable(participant: Participant, date: string): boolean {
  return participant.unavailableDates.includes(date);
}

function canPerformActivity(
  participant: Participant,
  activityId: string,
): boolean {
  return participant.allowedActivityIds.includes(activityId);
}

function getMaxActivities(
  participant: Participant,
  defaultLimit: number,
): number {
  return participant.maxActivitiesPerMeeting ?? defaultLimit;
}

export function regenerateMeeting({
  meetings,
  activities,
  participants,
  date,
  mode,
  distributionMode,
  defaultMaxActivitiesPerMeeting,
}: RegenerateMeetingInput): RegenerateMeetingResult {
  if (
    !Number.isInteger(defaultMaxActivitiesPerMeeting) ||
    defaultMaxActivitiesPerMeeting < 1
  ) {
    throw new Error("O limite padrão de atividades deve ser maior que zero.");
  }

  const meetingIndex = meetings.findIndex((meeting) => meeting.date === date);

  if (meetingIndex === -1) {
    throw new Error("Encontro não encontrado.");
  }

  const currentMeeting = meetings[meetingIndex];

  const activeActivities = activities.filter((activity) => activity.active);

  const activeParticipants = participants.filter(
    (participant) => participant.active,
  );

  const participantMap = new Map(
    participants.map((participant) => [participant.id, participant]),
  );

  const activityMap = new Map(
    activeActivities.map((activity) => [activity.id, activity]),
  );

  // Quantidade de participações nas outras datas do mês.
  const monthlyCount = new Map<string, number>();

  for (const meeting of meetings) {
    if (meeting.date === date) {
      continue;
    }

    for (const assignment of meeting.assignments) {
      monthlyCount.set(
        assignment.participantId,
        (monthlyCount.get(assignment.participantId) ?? 0) + 1,
      );
    }
  }

  const preservedAssignments = currentMeeting.assignments.filter(
    (assignment) => {
      if (mode === "FILL_EMPTY") {
        return true;
      }

      if (mode === "REDISTRIBUTE_ALL") {
        return false;
      }

      if (!assignment.locked) {
        return false;
      }

      const participant = participantMap.get(assignment.participantId);

      const activity = activityMap.get(assignment.activityId);

      if (!participant || !participant.active) {
        return false;
      }

      if (!activity) {
        return false;
      }

      if (!participant.allowedActivityIds.includes(assignment.activityId)) {
        return false;
      }

      if (participant.unavailableDates.includes(date)) {
        return false;
      }

      return true;
    },
  );

  const assignments: ScheduleAssignment[] = [...preservedAssignments];

  const meetingCount = new Map<string, number>();

  for (const assignment of preservedAssignments) {
    meetingCount.set(
      assignment.participantId,
      (meetingCount.get(assignment.participantId) ?? 0) + 1,
    );
  }

  const orderedActivities = [...activeActivities].sort(
    (a, b) => a.order - b.order,
  );

  let unfilledPositions = 0;

  for (const activity of orderedActivities) {
    const existing = assignments.filter(
      (assignment) => assignment.activityId === activity.id,
    );

    const remainingPositions = Math.max(
      0,
      activity.requiredParticipants - existing.length,
    );

    for (let position = 0; position < remainingPositions; position++) {
      const eligible = activeParticipants.filter((participant) => {
        if (isUnavailable(participant, date)) {
          return false;
        }

        if (!canPerformActivity(participant, activity.id)) {
          return false;
        }

        const maxActivities = getMaxActivities(
          participant,
          defaultMaxActivitiesPerMeeting,
        );

        const assignedCount = meetingCount.get(participant.id) ?? 0;

        if (assignedCount >= maxActivities) {
          return false;
        }

        // Evita escalar a mesma pessoa duas vezes
        // na mesma atividade.
        const alreadyAssigned = assignments.some(
          (assignment) =>
            assignment.activityId === activity.id &&
            assignment.participantId === participant.id,
        );

        return !alreadyAssigned;
      });

      if (eligible.length === 0) {
        unfilledPositions++;
        continue;
      }

      const randomized = shuffle(eligible);

      if (distributionMode === "BALANCED") {
        randomized.sort((a, b) => {
          const totalA =
            (monthlyCount.get(a.id) ?? 0) + (meetingCount.get(a.id) ?? 0);

          const totalB =
            (monthlyCount.get(b.id) ?? 0) + (meetingCount.get(b.id) ?? 0);

          return totalA - totalB;
        });
      }

      const selected = randomized[0];

      assignments.push({
        id: generateId(),
        activityId: activity.id,
        participantId: selected.id,
        locked: false,
      });

      meetingCount.set(selected.id, (meetingCount.get(selected.id) ?? 0) + 1);
    }
  }

  const updatedMeeting: MeetingSchedule = {
    ...currentMeeting,
    assignments,
  };

  const updatedMeetings = meetings.map((meeting, index) =>
    index === meetingIndex ? updatedMeeting : meeting,
  );

  const previousIds = new Set(
    currentMeeting.assignments.map((assignment) => assignment.id),
  );

  const updatedIds = new Set(assignments.map((assignment) => assignment.id));

  const removedInactiveAssignments = currentMeeting.assignments.filter(
    (assignment) => {
      if (updatedIds.has(assignment.id)) {
        return false;
      }

      const participant = participantMap.get(assignment.participantId);

      return participant?.active === false;
    },
  ).length;

  return {
    meetings: updatedMeetings,
    summary: {
      preservedAssignments: preservedAssignments.length,

      newAssignments: assignments.filter(
        (assignment) => !previousIds.has(assignment.id),
      ).length,

      removedAssignments: currentMeeting.assignments.filter(
        (assignment) => !updatedIds.has(assignment.id),
      ).length,

      unfilledPositions,

      removedInactiveAssignments,
    },
  };
}
