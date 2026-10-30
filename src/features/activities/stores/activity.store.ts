import { create } from "zustand";

import type {
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
} from "../types/activity.types";

import { activityRepository } from "../services/activity.repository";

interface ActivityState {
  activities: Activity[];

  loading: boolean;
  saving: boolean;
  error: string | null;

  fetchActivities: () => Promise<void>;

  createActivity: (data: CreateActivityInput) => Promise<Activity>;

  updateActivity: (id: string, data: UpdateActivityInput) => Promise<Activity>;

  deleteActivity: (id: string) => Promise<void>;

  clearError: () => void;

  reorderActivities: (ids: string[]) => Promise<void>;

  resetActivities: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  loading: false,
  saving: false,
  error: null,

  fetchActivities: async () => {
    set({ loading: true, error: null });

    try {
      const activities = await activityRepository.findAll();

      set({ activities });
    } catch (error) {
      set({ error: getErrorMessage(error) });
    } finally {
      set({ loading: false });
    }
  },

  resetActivities: async () => {
    set({ saving: true, error: null });

    try {
      const activities = await activityRepository.resetToDefault();

      set({ activities });
    } catch (error) {
      set({
        error: getErrorMessage(error),
      });

      throw error;
    } finally {
      set({ saving: false });
    }
  },

  reorderActivities: async (ids) => {
    set({ saving: true, error: null });

    try {
      const activities = await activityRepository.reorder(ids);

      set({ activities });
    } catch (error) {
      set({
        error: getErrorMessage(error),
      });

      throw error;
    } finally {
      set({ saving: false });
    }
  },

  createActivity: async (data) => {
    set({ saving: true, error: null });

    try {
      const activity = await activityRepository.create(data);

      set((state) => ({
        activities: [...state.activities, activity].sort(
          (a, b) => a.order - b.order,
        ),
      }));

      return activity;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  updateActivity: async (id, data) => {
    set({ saving: true, error: null });

    try {
      const updated = await activityRepository.update(id, data);

      set((state) => ({
        activities: state.activities
          .map((activity) => (activity.id === id ? updated : activity))
          .sort((a, b) => a.order - b.order),
      }));

      return updated;
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  deleteActivity: async (id) => {
    set({ saving: true, error: null });

    try {
      await activityRepository.delete(id);

      const activities = await activityRepository.findAll();

      set({ activities });
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  clearError: () => set({ error: null }),
}));
