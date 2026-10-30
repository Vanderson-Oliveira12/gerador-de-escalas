import type {
  Activity,
  ActivityRepository,
  CreateActivityInput,
  UpdateActivityInput,
} from "../types/activity.types";

import {
  createActivitySchema,
  updateActivitySchema,
} from "../schemas/activity.schema";

import { DEFAULT_ACTIVITIES } from "@/constants/activities";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { generateId } from "@/shared/utils/id.utils";

export class LocalActivityRepository implements ActivityRepository {
  private read(): Activity[] {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);

    if (stored !== null) {
      try {
        const parsed: unknown = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
          throw new Error("Formato inválido.");
        }

        return parsed as Activity[];
      } catch {
        throw new Error("Não foi possível carregar as atividades.");
      }
    }

    const now = new Date().toISOString();

    const activities: Activity[] = DEFAULT_ACTIVITIES.map((activity) => ({
      ...activity,
      createdAt: now,
      updatedAt: now,
    }));

    this.write(activities);

    return activities;
  }

  private write(activities: Activity[]): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }

  async findAll(): Promise<Activity[]> {
    return this.read().sort((a, b) => a.order - b.order);
  }

  async findById(id: string): Promise<Activity | null> {
    return this.read().find((activity) => activity.id === id) ?? null;
  }

  async create(data: CreateActivityInput): Promise<Activity> {
    const validated = createActivitySchema.parse(data);

    const activities = this.read();

    const now = new Date().toISOString();

    const activity: Activity = {
      ...validated,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.write([...activities, activity]);

    return activity;
  }

  async update(id: string, data: UpdateActivityInput): Promise<Activity> {
    const validated = updateActivitySchema.parse(data);

    const activities = this.read();

    const index = activities.findIndex((activity) => activity.id === id);

    if (index === -1) {
      throw new Error("Atividade não encontrada.");
    }

    const updated: Activity = {
      ...activities[index],
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    activities[index] = updated;

    this.write(activities);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const activities = this.read();

    const exists = activities.some((activity) => activity.id === id);

    if (!exists) {
      throw new Error("Atividade não encontrada.");
    }

    const remaining = activities
      .filter((activity) => activity.id !== id)
      .sort((a, b) => a.order - b.order)
      .map((activity, index) => ({
        ...activity,
        order: index,
      }));

    this.write(remaining);
  }

  async resetToDefault(): Promise<Activity[]> {
    const now = new Date().toISOString();

    const activities: Activity[] = DEFAULT_ACTIVITIES.map((activity) => ({
      ...activity,
      createdAt: now,
      updatedAt: now,
    }));

    this.write(activities);

    return activities;
  }

  async reorder(ids: string[]): Promise<Activity[]> {
    const activities = this.read();

    const existingIds = new Set(activities.map((activity) => activity.id));

    if (
      ids.length !== activities.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !existingIds.has(id))
    ) {
      throw new Error("A ordenação informada é inválida.");
    }

    const now = new Date().toISOString();

    const reordered = ids.map((id, index) => {
      const activity = activities.find((item) => item.id === id)!;

      return {
        ...activity,
        order: index,
        updatedAt: now,
      };
    });

    this.write(reordered);

    return reordered;
  }
}

export const activityRepository = new LocalActivityRepository();
