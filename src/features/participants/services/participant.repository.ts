import type {
  Participant,
  ParticipantRepository,
  CreateParticipantInput,
  UpdateParticipantInput,
} from "../types/participant.types";

import {
  createParticipantSchema,
  updateParticipantSchema,
} from "../schemas/participant.schema";
import { generateId } from "@/shared/utils/id.utils";

const STORAGE_KEY = "lar:participants";

export class LocalParticipantRepository implements ParticipantRepository {
  private read(): Participant[] {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        throw new Error("Formato inválido de participantes.");
      }

      return parsed as Participant[];
    } catch {
      throw new Error(
        "Não foi possível carregar os participantes armazenados.",
      );
    }
  }

  private write(participants: Participant[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
  }

  async findAll(): Promise<Participant[]> {
    return this.read();
  }

  async findById(id: string): Promise<Participant | null> {
    return this.read().find((participant) => participant.id === id) ?? null;
  }

  async create(data: CreateParticipantInput): Promise<Participant> {
    const validated = createParticipantSchema.parse(data);

    const participants = this.read();

    const now = new Date().toISOString();

    const participant: Participant = {
      ...validated,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.write([...participants, participant]);

    return participant;
  }

  async update(id: string, data: UpdateParticipantInput): Promise<Participant> {
    const validated = updateParticipantSchema.parse(data);

    const participants = this.read();

    const index = participants.findIndex(
      (participant) => participant.id === id,
    );

    if (index === -1) {
      throw new Error("Participante não encontrado.");
    }

    const updated: Participant = {
      ...participants[index],
      ...validated,
      updatedAt: new Date().toISOString(),
    };

    participants[index] = updated;

    this.write(participants);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const participants = this.read();

    const exists = participants.some((participant) => participant.id === id);

    if (!exists) {
      throw new Error("Participante não encontrado.");
    }

    this.write(participants.filter((participant) => participant.id !== id));
  }
}

export const participantRepository = new LocalParticipantRepository();
