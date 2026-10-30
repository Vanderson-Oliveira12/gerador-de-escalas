import { create } from "zustand";

import type {
  SavedMonthlySchedule,
  SaveMonthlyScheduleInput,
} from "../types/schedule-persistence.types";

import type { ScheduleGenerationResult } from "../types/schedule.types";

import { scheduleRepository } from "../services/schedule.repository";

interface ScheduleState {
  savedMonth: SavedMonthlySchedule | null;

  preview: ScheduleGenerationResult | null;

  loading: boolean;
  saving: boolean;
  error: string | null;

  loadMonth: (year: number, month: number) => Promise<void>;

  setPreview: (preview: ScheduleGenerationResult | null) => void;

  saveMonth: (input: SaveMonthlyScheduleInput) => Promise<void>;

  clear: () => void;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  savedMonth: null,
  preview: null,

  loading: false,
  saving: false,
  error: null,

  loadMonth: async (year, month) => {
    set({
      loading: true,
      error: null,
      savedMonth: null,
      preview: null,
    });

    try {
      const savedMonth = await scheduleRepository.findByMonth(year, month);

      set({ savedMonth });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    } finally {
      set({ loading: false });
    }
  },

  setPreview: (preview) => {
    set({ preview });
  },

  saveMonth: async (input) => {
    set({ saving: true, error: null });

    try {
      const savedMonth = await scheduleRepository.saveMonth(input);

      set({
        savedMonth,
        preview: null,
      });
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  clear: () => {
    set({
      savedMonth: null,
      preview: null,
      error: null,
    });
  },
}));
