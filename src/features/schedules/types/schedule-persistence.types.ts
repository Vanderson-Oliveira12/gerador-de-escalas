import type {
  DistributionMode,
  MeetingSchedule,
  ScheduleAssignment,
} from "./schedule.types";

export interface AssignmentSnapshot {
  assignmentId: string;
  participantName: string;
  activityName: string;
}

export interface SavedMonthlySchedule {
  id: string;
  year: number;
  month: number;

  mode: DistributionMode;
  defaultMaxActivitiesPerMeeting: number;

  meetings: MeetingSchedule[];

  snapshots: AssignmentSnapshot[];

  createdAt: string;
  updatedAt: string;
}

export interface SaveMonthlyScheduleInput {
  year: number;
  month: number;

  mode: DistributionMode;
  defaultMaxActivitiesPerMeeting: number;

  meetings: MeetingSchedule[];
  snapshots: AssignmentSnapshot[];
}

export interface ScheduleRepository {
  findByMonth(
    year: number,
    month: number,
  ): Promise<SavedMonthlySchedule | null>;

  findAll(): Promise<SavedMonthlySchedule[]>;

  saveMonth(input: SaveMonthlyScheduleInput): Promise<SavedMonthlySchedule>;

  deleteMonth(year: number, month: number): Promise<void>;
}

export function getHistoricalAssignments(
  months: SavedMonthlySchedule[],
  year: number,
  month: number,
): ScheduleAssignment[] {
  const target = year * 12 + month;

  return months
    .filter((item) => item.year * 12 + item.month < target)
    .flatMap((item) => item.meetings.flatMap((meeting) => meeting.assignments));
}
