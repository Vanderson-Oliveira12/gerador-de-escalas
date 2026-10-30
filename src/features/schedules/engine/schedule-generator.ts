import { getThursdaysOfMonth } from "../utils/schedule-dates";

import {
  addAssignmentToWorkload,
  createWorkloadStats,
} from "./workload-calculator";

import { solveMeetingAssignments } from "./meeting-assignment-solver";

import { validateLockedAssignments } from "./schedule-validator";

import type {
  MeetingSchedule,
  ScheduleAssignment,
  ScheduleGenerationInput,
  ScheduleGenerationResult,
  ScheduleIssue,
} from "../types/schedule.types";
import { generateId } from "@/shared/utils/id.utils";

export function generateSchedules(
  input: ScheduleGenerationInput,
  random: () => number = Math.random,
): ScheduleGenerationResult {
  const {
    year,
    month,
    participants,
    activities,
    mode,
    defaultMaxActivitiesPerMeeting,
    existingSchedules = [],
    historicalAssignments = [],
  } = input;

  if (
    !Number.isInteger(defaultMaxActivitiesPerMeeting) ||
    defaultMaxActivitiesPerMeeting < 1
  ) {
    throw new Error("O limite padrão de atividades deve ser maior que zero.");
  }

  if (mode !== "BALANCED" && mode !== "RANDOM") {
    throw new Error("Modo de distribuição inválido.");
  }

  const dates = getThursdaysOfMonth(year, month);

  const activeActivities = [...activities]
    .filter((activity) => activity.active)
    .sort((a, b) => a.order - b.order);

  const existingByDate = new Map(
    existingSchedules.map((schedule) => [schedule.date, schedule]),
  );

  const workload = createWorkloadStats(historicalAssignments);

  const historicalCounts = new Map(workload.total);

  const schedules: MeetingSchedule[] = [];
  const issues: ScheduleIssue[] = [];

  let unfilledPositions = 0;

  // Contabilizamos previamente todas as atribuições
  // bloqueadas do mês para o balanceamento.
  for (const date of dates) {
    const existing = existingByDate.get(date);

    for (const assignment of existing?.assignments ?? []) {
      if (!assignment.locked) continue;

      addAssignmentToWorkload(workload, assignment, date);
    }
  }

  for (const date of dates) {
    const existing = existingByDate.get(date);

    // Mantém somente as escolhas manuais bloqueadas.
    const lockedAssignments: ScheduleAssignment[] = (
      existing?.assignments ?? []
    )
      .filter((assignment) => assignment.locked)
      .map((assignment) => ({ ...assignment }));

    issues.push(
      ...validateLockedAssignments({
        date,
        assignments: lockedAssignments,
        participants,
        activities,
        defaultMaxActivitiesPerMeeting,
      }),
    );

    const generated = solveMeetingAssignments({
      date,
      participants,
      activities: activeActivities,
      lockedAssignments,
      defaultMaxActivitiesPerMeeting,
      mode,
      workload,
      random,
    });

    const newAssignments: ScheduleAssignment[] = generated.map(
      (assignment) => ({
        id: generateId(),
        activityId: assignment.activityId,
        participantId: assignment.participantId,
        locked: false,
      }),
    );

    for (const assignment of newAssignments) {
      addAssignmentToWorkload(workload, assignment, date);
    }

    const assignments = [...lockedAssignments, ...newAssignments];

    // Calcula as vagas faltantes depois de resolver
    // todas as atividades em conjunto.
    for (const activity of activeActivities) {
      const assignedCount = assignments.filter(
        (assignment) => assignment.activityId === activity.id,
      ).length;

      const missingCount = Math.max(
        0,
        activity.requiredParticipants - assignedCount,
      );

      if (missingCount === 0) continue;

      unfilledPositions += missingCount;

      const hasEligibleParticipant = participants.some(
        (participant) =>
          participant.active &&
          participant.allowedActivityIds.includes(activity.id) &&
          !participant.unavailableDates.includes(date),
      );

      issues.push({
        code: hasEligibleParticipant
          ? "INSUFFICIENT_PARTICIPANTS"
          : "NO_ELIGIBLE_PARTICIPANTS",

        date,
        activityId: activity.id,
        missingCount,

        message: hasEligibleParticipant
          ? `${activity.name}: ${missingCount} vaga(s) não preenchida(s) em ${date}.`
          : `${activity.name}: nenhum participante disponível em ${date}.`,
      });
    }

    schedules.push({
      id: existing?.id ?? generateId(),
      date,
      assignments,
    });
  }

  const generatedCounts = new Map<string, number>();

  for (const schedule of schedules) {
    for (const assignment of schedule.assignments) {
      generatedCounts.set(
        assignment.participantId,
        (generatedCounts.get(assignment.participantId) ?? 0) + 1,
      );
    }
  }

  const participantDistribution = participants.map((participant) => {
    const historicalCount = historicalCounts.get(participant.id) ?? 0;

    const generatedCount = generatedCounts.get(participant.id) ?? 0;

    return {
      participantId: participant.id,
      historicalCount,
      generatedCount,
      totalCount: historicalCount + generatedCount,
    };
  });

  return {
    schedules,
    issues,

    stats: {
      totalMeetings: schedules.length,

      totalAssignments: schedules.reduce(
        (total, schedule) => total + schedule.assignments.length,
        0,
      ),

      unfilledPositions,

      participantDistribution,
    },
  };
}
