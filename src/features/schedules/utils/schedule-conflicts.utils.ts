import type { Participant } from "@/features/participants/types/participant.types";

import type { MeetingSchedule } from "../types/schedule.types";

export interface InactiveParticipantConflict {
  meetingId: string;
  meetingDate: string;
  assignmentId: string;
  activityId: string;
  participantId: string;
  participantName: string;
}

export function getInactiveParticipantConflicts({
  meetings,
  participants,
  fromDate,
}: {
  meetings: MeetingSchedule[];
  participants: Participant[];
  fromDate?: string;
}): InactiveParticipantConflict[] {
  const participantMap = new Map(
    participants.map((participant) => [participant.id, participant]),
  );

  return meetings.flatMap((meeting) => {
    if (fromDate && meeting.date < fromDate) {
      return [];
    }

    return meeting.assignments.flatMap((assignment) => {
      const participant = participantMap.get(assignment.participantId);

      if (!participant || participant.active) {
        return [];
      }

      return [
        {
          meetingId: meeting.id,
          meetingDate: meeting.date,
          assignmentId: assignment.id,
          activityId: assignment.activityId,
          participantId: participant.id,
          participantName: participant.name,
        },
      ];
    });
  });
}

export function getParticipantFutureAssignments({
  participantId,
  meetings,
  fromDate,
}: {
  participantId: string;
  meetings: MeetingSchedule[];
  fromDate: string;
}) {
  return meetings.flatMap((meeting) => {
    if (meeting.date < fromDate) {
      return [];
    }

    return meeting.assignments
      .filter((assignment) => assignment.participantId === participantId)
      .map((assignment) => ({
        meetingId: meeting.id,
        meetingDate: meeting.date,
        assignmentId: assignment.id,
        activityId: assignment.activityId,
      }));
  });
}
