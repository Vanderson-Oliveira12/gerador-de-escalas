import { generateId } from "@/shared/utils/id.utils";
import type {
  SavedMonthlySchedule,
  SaveMonthlyScheduleInput,
  ScheduleRepository,
} from "../types/schedule-persistence.types";
import { STORAGE_KEYS } from "@/constants/storage-keys";

export class LocalScheduleRepository implements ScheduleRepository {
  private read(): SavedMonthlySchedule[] {
    const stored = localStorage.getItem(STORAGE_KEYS.SCHEDULES);

    if (stored === null) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        throw new Error("Formato inválido.");
      }

      return parsed as SavedMonthlySchedule[];
    } catch {
      throw new Error("Não foi possível carregar as escalas armazenadas.");
    }
  }

  private write(months: SavedMonthlySchedule[]): void {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(months));
  }

  async findAll(): Promise<SavedMonthlySchedule[]> {
    return this.read();
  }

  async findByMonth(
    year: number,
    month: number,
  ): Promise<SavedMonthlySchedule | null> {
    return (
      this.read().find((item) => item.year === year && item.month === month) ??
      null
    );
  }

  async saveMonth(
    input: SaveMonthlyScheduleInput,
  ): Promise<SavedMonthlySchedule> {
    const months = this.read();

    const existingIndex = months.findIndex(
      (item) => item.year === input.year && item.month === input.month,
    );

    const existing = existingIndex >= 0 ? months[existingIndex] : null;

    const now = new Date().toISOString();

    const saved: SavedMonthlySchedule = {
      ...input,

      id: existing?.id ?? generateId(),

      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    // Substitui o mês inteiro em uma única gravação.
    if (existingIndex >= 0) {
      months[existingIndex] = saved;
    } else {
      months.push(saved);
    }

    this.write(months);

    return saved;
  }

  async deleteMonth(year: number, month: number): Promise<void> {
    const months = this.read();

    this.write(
      months.filter((item) => !(item.year === year && item.month === month)),
    );
  }
}

export const scheduleRepository = new LocalScheduleRepository();
