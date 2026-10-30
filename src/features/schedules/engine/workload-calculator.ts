import type { ScheduleAssignment } from "../types/schedule.types";

export type WorkloadMap = Map<string, number>;

export interface WorkloadStats {
  total: WorkloadMap;
  byActivity: Map<string, number>;
  byMeeting: Map<string, number>;
}

export function activityWorkloadKey(
  participantId: string,
  activityId: string,
): string {
  return JSON.stringify([participantId, activityId]);
}

export function meetingWorkloadKey(
  participantId: string,
  date: string,
): string {
  return JSON.stringify([participantId, date]);
}

export function calculateWorkload(
  assignments: ScheduleAssignment[],
): WorkloadMap {
  const workload: WorkloadMap = new Map();

  for (const assignment of assignments) {
    incrementWorkload(workload, assignment.participantId);
  }

  return workload;
}

export function incrementWorkload(
  workload: WorkloadMap,
  participantId: string,
): void {
  workload.set(participantId, (workload.get(participantId) ?? 0) + 1);
}

export function createWorkloadStats(
  assignments: ScheduleAssignment[] = [],
): WorkloadStats {
  const stats: WorkloadStats = {
    total: new Map(),
    byActivity: new Map(),
    byMeeting: new Map(),
  };

  for (const assignment of assignments) {
    addAssignmentToWorkload(stats, assignment);
  }

  return stats;
}

export function addAssignmentToWorkload(
  stats: WorkloadStats,
  assignment: ScheduleAssignment,
  date?: string,
): void {
  incrementWorkload(stats.total, assignment.participantId);

  incrementWorkload(
    stats.byActivity,
    activityWorkloadKey(assignment.participantId, assignment.activityId),
  );

  if (date) {
    incrementWorkload(
      stats.byMeeting,
      meetingWorkloadKey(assignment.participantId, date),
    );
  }
}
