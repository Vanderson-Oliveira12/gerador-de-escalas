import { useCallback } from "react";

import { generateSchedules } from "../engine/schedule-generator";

import { useScheduleStore } from "../stores/schedule.store";

import { participantRepository } from "@/features/participants/services/participant.repository";

import { activityRepository } from "@/features/activities/services/activity.repository";

import { scheduleRepository } from "../services/schedule.repository";

import { getHistoricalAssignments } from "../types/schedule-persistence.types";

import type { DistributionMode } from "../types/schedule.types";

interface GenerateMonthOptions {
  year: number;
  month: number;
  mode: DistributionMode;
  defaultMaxActivitiesPerMeeting: number;
  preserveLockedAssignments: boolean;
}

export function useSchedules() {
  const savedMonth = useScheduleStore((state) => state.savedMonth);

  const preview = useScheduleStore((state) => state.preview);

  const loading = useScheduleStore((state) => state.loading);

  const saving = useScheduleStore((state) => state.saving);

  const error = useScheduleStore((state) => state.error);

  const loadMonth = useScheduleStore((state) => state.loadMonth);

  const setPreview = useScheduleStore((state) => state.setPreview);

  const saveMonth = useScheduleStore((state) => state.saveMonth);

  const generateMonth = useCallback(
    async (options: GenerateMonthOptions) => {
      const [participants, activities, savedMonths] = await Promise.all([
        participantRepository.findAll(),
        activityRepository.findAll(),
        scheduleRepository.findAll(),
      ]);

      const existingMonth = savedMonths.find(
        (item) => item.year === options.year && item.month === options.month,
      );

      const historicalAssignments = getHistoricalAssignments(
        savedMonths,
        options.year,
        options.month,
      );

      const result = generateSchedules({
        year: options.year,
        month: options.month,

        participants,
        activities,

        mode: options.mode,

        defaultMaxActivitiesPerMeeting: options.defaultMaxActivitiesPerMeeting,

        historicalAssignments,

        existingSchedules: options.preserveLockedAssignments
          ? (existingMonth?.meetings ?? [])
          : [],
      });

      setPreview(result);

      return result;
    },
    [setPreview],
  );

  const confirmMonth = useCallback(
    async (options: GenerateMonthOptions) => {
      if (!preview) {
        throw new Error("Nenhuma escala foi gerada para salvar.");
      }

      const [participants, activities] = await Promise.all([
        participantRepository.findAll(),
        activityRepository.findAll(),
      ]);

      const participantNames = new Map(
        participants.map((participant) => [participant.id, participant.name]),
      );

      const activityNames = new Map(
        activities.map((activity) => [activity.id, activity.name]),
      );

      const existingSnapshots = new Map(
        savedMonth?.snapshots.map((snapshot) => [
          snapshot.assignmentId,
          snapshot,
        ]) ?? [],
      );

      const snapshots = preview.schedules.flatMap((meeting) =>
        meeting.assignments.map((assignment) => {
          const previous = existingSnapshots.get(assignment.id);

          return {
            assignmentId: assignment.id,

            participantName:
              previous?.participantName ??
              participantNames.get(assignment.participantId) ??
              "Participante não encontrado",

            activityName:
              previous?.activityName ??
              activityNames.get(assignment.activityId) ??
              "Atividade não encontrada",
          };
        }),
      );

      await saveMonth({
        year: options.year,
        month: options.month,
        mode: options.mode,

        defaultMaxActivitiesPerMeeting: options.defaultMaxActivitiesPerMeeting,

        meetings: preview.schedules,
        snapshots,
      });
    },
    [preview, savedMonth, saveMonth],
  );

  return {
    savedMonth,
    preview,
    loading,
    saving,
    error,

    loadMonth,
    generateMonth,
    confirmMonth,

    discardPreview: () => setPreview(null),
  };
}
