import { create } from "zustand";

import type {
  Participant,
  CreateParticipantInput,
  UpdateParticipantInput,
} from "../types/participant.types";

import { participantRepository } from "../services/participant.repository";

interface ParticipantState {
  participants: Participant[];

  loading: boolean;

  saving: boolean;

  error: string | null;

  fetchParticipants: () => Promise<void>;

  createParticipant: (data: CreateParticipantInput) => Promise<Participant>;

  updateParticipant: (
    id: string,
    data: UpdateParticipantInput,
  ) => Promise<Participant>;

  deleteParticipant: (id: string) => Promise<void>;

  clearError: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado.";
}

export const useParticipantStore = create<ParticipantState>((set) => ({
  participants: [],

  loading: false,

  saving: false,

  error: null,

  fetchParticipants: async () => {
    set({
      loading: true,
      error: null,
    });

    try {
      const participants = await participantRepository.findAll();

      set({ participants });
    } catch (error) {
      set({
        error: getErrorMessage(error),
      });
    } finally {
      set({ loading: false });
    }
  },

  createParticipant: async (data) => {
    set({
      saving: true,
      error: null,
    });

    try {
      const participant = await participantRepository.create(data);

      set((state) => ({
        participants: [...state.participants, participant],
      }));

      return participant;
    } catch (error) {
      set({
        error: getErrorMessage(error),
      });

      throw error;
    } finally {
      set({ saving: false });
    }
  },

  updateParticipant: async (id, data) => {
    set({
      saving: true,
      error: null,
    });

    try {
      const updated = await participantRepository.update(id, data);

      set((state) => ({
        participants: state.participants.map((participant) =>
          participant.id === id ? updated : participant,
        ),
      }));

      return updated;
    } catch (error) {
      set({
        error: getErrorMessage(error),
      });

      throw error;
    } finally {
      set({ saving: false });
    }
  },

  deleteParticipant: async (id) => {
    set({
      saving: true,
      error: null,
    });

    try {
      await participantRepository.delete(id);

      set((state) => ({
        participants: state.participants.filter(
          (participant) => participant.id !== id,
        ),
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error),
      });

      throw error;
    } finally {
      set({ saving: false });
    }
  },

  clearError: () => set({ error: null }),
}));
