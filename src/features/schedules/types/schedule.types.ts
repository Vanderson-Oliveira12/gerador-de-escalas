import type { Participant } from "@/features/participants/types/participant.types";

import type { Activity } from "@/features/activities/types/activity.types";

export type DistributionMode = "BALANCED" | "RANDOM";

export interface ScheduleAssignment {
  id: string;
  activityId: string;
  participantId: string;
  locked: boolean;
}

export interface MeetingSchedule {
  id: string;
  date: string;
  assignments: ScheduleAssignment[];
}

export type ScheduleIssueCode =
  | "NO_ELIGIBLE_PARTICIPANTS"
  | "INSUFFICIENT_PARTICIPANTS"
  | "INVALID_LOCKED_ASSIGNMENT"
  | "EXCESS_LOCKED_ASSIGNMENTS";

export interface ScheduleIssue {
  code: ScheduleIssueCode;
  date: string;
  activityId: string;
  message: string;
  missingCount?: number;
}

export interface ScheduleGenerationInput {
  year: number;
  month: number;

  participants: Participant[];
  activities: Activity[];

  mode: DistributionMode;

  defaultMaxActivitiesPerMeeting: number;

  existingSchedules?: MeetingSchedule[];

  historicalAssignments?: ScheduleAssignment[];
}

export interface ParticipantDistributionStat {
  participantId: string;
  historicalCount: number;
  generatedCount: number;
  totalCount: number;
}

export interface ScheduleGenerationResult {
  schedules: MeetingSchedule[];
  issues: ScheduleIssue[];

  stats: {
    totalMeetings: number;
    totalAssignments: number;
    unfilledPositions: number;
    participantDistribution: ParticipantDistributionStat[];
  };
}
