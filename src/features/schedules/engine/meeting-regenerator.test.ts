import { describe, expect, it } from "vitest";

import type { Activity } from "@/features/activities/types/activity.types";
import type { Participant } from "@/features/participants/types/participant.types";

import type {
  MeetingSchedule,
  ScheduleAssignment,
} from "../types/schedule.types";

import { regenerateMeeting } from "./meeting-regenerator";
import { generateId } from "@/shared/utils/id.utils";

// ======================================================
// FIXTURES
// ======================================================

const DATE = "2026-11-12";
const OTHER_DATE = "2026-11-19";

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "activity-1",
    name: "Louvor",
    order: 1,
    durationMinutes: 15,
    requiredParticipants: 1,
    active: true,
    ...overrides,
  } as Activity;
}

function createParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: "participant-1",
    name: "João",
    active: true,
    unavailableDates: [],
    allowedActivityIds: ["activity-1"],
    maxActivitiesPerMeeting: 1,
    ...overrides,
  } as Participant;
}

function createAssignment(
  overrides: Partial<ScheduleAssignment> = {},
): ScheduleAssignment {
  return {
    id: "assignment-1",
    activityId: "activity-1",
    participantId: "participant-1",
    locked: false,
    ...overrides,
  };
}

function createMeeting(
  overrides: Partial<MeetingSchedule> = {},
): MeetingSchedule {
  return {
    id: generateId(),
    date: DATE,
    assignments: [],
    ...overrides,
  };
}

function generate(
  overrides: Partial<Parameters<typeof regenerateMeeting>[0]> = {},
) {
  return regenerateMeeting({
    meetings: [createMeeting()],
    activities: [createActivity()],
    participants: [createParticipant()],
    date: DATE,
    mode: "FILL_EMPTY",
    distributionMode: "BALANCED",
    defaultMaxActivitiesPerMeeting: 1,
    ...overrides,
  });
}

// ======================================================
// TESTS
// ======================================================

describe("meeting-regenerator", () => {
  describe("Validações", () => {
    it("deve rejeitar um limite padrão inválido", () => {
      expect(() =>
        generate({
          defaultMaxActivitiesPerMeeting: 0,
        }),
      ).toThrow("O limite padrão de atividades deve ser maior que zero.");
    });

    it("deve rejeitar uma data inexistente", () => {
      expect(() =>
        generate({
          date: "2026-12-31",
        }),
      ).toThrow("Encontro não encontrado.");
    });
  });

  describe("Participantes inativos", () => {
    it("não deve atribuir novas atividades a participantes inativos", () => {
      const result = generate({
        participants: [
          createParticipant({
            active: false,
          }),
        ],
      });

      expect(result.meetings[0].assignments).toHaveLength(0);
      expect(result.summary.unfilledPositions).toBe(1);
    });

    it("deve preservar atribuições existentes no modo FILL_EMPTY", () => {
      const existing = createAssignment({
        locked: true,
      });

      const result = generate({
        mode: "FILL_EMPTY",
        meetings: [
          createMeeting({
            assignments: [existing],
          }),
        ],
        participants: [
          createParticipant({
            active: false,
          }),
        ],
      });

      expect(result.meetings[0].assignments).toContainEqual(existing);

      expect(result.summary.removedInactiveAssignments).toBe(0);
    });

    it("deve substituir participantes inativos mesmo que estejam fixados", () => {
      const existing = createAssignment({
        locked: true,
      });

      const result = generate({
        mode: "PRESERVE_LOCKED",
        meetings: [
          createMeeting({
            assignments: [existing],
          }),
        ],
        participants: [
          createParticipant({
            active: false,
          }),
          createParticipant({
            id: "participant-2",
            name: "Bianca",
            active: true,
          }),
        ],
      });

      const assignments = result.meetings[0].assignments;

      expect(assignments).toHaveLength(1);

      expect(assignments[0].participantId).toBe("participant-2");

      expect(result.summary.removedInactiveAssignments).toBe(1);
      expect(result.summary.newAssignments).toBe(1);
    });

    it("deve remover atribuições inativas no modo REDISTRIBUTE_ALL", () => {
      const existing = createAssignment({
        locked: true,
      });

      const result = generate({
        mode: "REDISTRIBUTE_ALL",
        meetings: [
          createMeeting({
            assignments: [existing],
          }),
        ],
        participants: [
          createParticipant({
            active: false,
          }),
        ],
      });

      expect(result.meetings[0].assignments).toHaveLength(0);

      expect(result.summary.removedInactiveAssignments).toBe(1);
      expect(result.summary.unfilledPositions).toBe(1);
    });
  });

  describe("Regeneração individual", () => {
    it("não deve modificar outras quintas-feiras", () => {
      const otherMeeting = createMeeting({
        date: OTHER_DATE,
        assignments: [
          createAssignment({
            id: "other-assignment",
          }),
        ],
      });

      const result = generate({
        meetings: [createMeeting(), otherMeeting],
      });

      expect(result.meetings[1]).toEqual(otherMeeting);

      expect(result.meetings[0].assignments).toHaveLength(1);
    });

    it("deve preencher uma vaga disponível", () => {
      const result = generate();

      expect(result.meetings[0].assignments).toHaveLength(1);

      expect(result.meetings[0].assignments[0].participantId).toBe(
        "participant-1",
      );

      expect(result.summary.newAssignments).toBe(1);
      expect(result.summary.unfilledPositions).toBe(0);
    });
  });

  describe("FILL_EMPTY", () => {
    it("deve preservar atribuições existentes", () => {
      const existing = createAssignment();

      const result = generate({
        meetings: [
          createMeeting({
            assignments: [existing],
          }),
        ],
      });

      expect(result.meetings[0].assignments).toEqual([existing]);

      expect(result.summary.preservedAssignments).toBe(1);
      expect(result.summary.newAssignments).toBe(0);
      expect(result.summary.removedAssignments).toBe(0);
    });
  });

  describe("PRESERVE_LOCKED", () => {
    it("deve preservar responsáveis fixados", () => {
      const lockedAssignment = createAssignment({
        locked: true,
      });

      const result = generate({
        mode: "PRESERVE_LOCKED",
        meetings: [
          createMeeting({
            assignments: [lockedAssignment],
          }),
        ],
      });

      expect(result.meetings[0].assignments).toContainEqual(lockedAssignment);

      expect(result.summary.preservedAssignments).toBe(1);
      expect(result.summary.removedAssignments).toBe(0);
    });

    it("deve remover atribuições não fixadas", () => {
      const unlockedAssignment = createAssignment();

      const result = generate({
        mode: "PRESERVE_LOCKED",
        meetings: [
          createMeeting({
            assignments: [unlockedAssignment],
          }),
        ],
      });

      expect(
        result.meetings[0].assignments.some(
          (assignment) => assignment.id === unlockedAssignment.id,
        ),
      ).toBe(false);

      expect(result.summary.removedAssignments).toBe(1);
      expect(result.summary.newAssignments).toBe(1);
    });
  });

  describe("REDISTRIBUTE_ALL", () => {
    it("deve permitir substituir atribuições fixadas", () => {
      const lockedAssignment = createAssignment({
        locked: true,
      });

      const result = generate({
        mode: "REDISTRIBUTE_ALL",
        meetings: [
          createMeeting({
            assignments: [lockedAssignment],
          }),
        ],
      });

      const newAssignment = result.meetings[0].assignments[0];

      expect(newAssignment.id).not.toBe(lockedAssignment.id);

      expect(newAssignment.locked).toBe(false);

      expect(result.summary.preservedAssignments).toBe(0);
      expect(result.summary.removedAssignments).toBe(1);
      expect(result.summary.newAssignments).toBe(1);
    });
  });

  describe("Restrições dos participantes", () => {
    it("não deve selecionar participantes indisponíveis", () => {
      const result = generate({
        participants: [
          createParticipant({
            unavailableDates: [DATE],
          }),
        ],
      });

      expect(result.meetings[0].assignments).toHaveLength(0);
      expect(result.summary.unfilledPositions).toBe(1);
    });

    it("não deve selecionar participantes sem permissão para a atividade", () => {
      const result = generate({
        participants: [
          createParticipant({
            allowedActivityIds: [],
          }),
        ],
      });

      expect(result.meetings[0].assignments).toHaveLength(0);
      expect(result.summary.unfilledPositions).toBe(1);
    });

    it("não deve selecionar participantes inativos", () => {
      const result = generate({
        participants: [
          createParticipant({
            active: false,
          }),
        ],
      });

      expect(result.meetings[0].assignments).toHaveLength(0);
      expect(result.summary.unfilledPositions).toBe(1);
    });

    it("deve respeitar o limite de atividades por encontro", () => {
      const result = generate({
        activities: [
          createActivity({
            id: "activity-1",
            order: 1,
          }),
          createActivity({
            id: "activity-2",
            order: 2,
          }),
        ],
        participants: [
          createParticipant({
            allowedActivityIds: ["activity-1", "activity-2"],
            maxActivitiesPerMeeting: 1,
          }),
        ],
      });

      expect(result.meetings[0].assignments).toHaveLength(1);
      expect(result.summary.unfilledPositions).toBe(1);
    });
  });

  describe("Distribuição equilibrada", () => {
    it("deve priorizar quem possui menos atribuições no mês", () => {
      const participantA = createParticipant({
        id: "participant-a",
        name: "João",
      });

      const participantB = createParticipant({
        id: "participant-b",
        name: "Maria",
      });

      const otherMeeting = createMeeting({
        date: OTHER_DATE,
        assignments: [
          createAssignment({
            id: "other-assignment",
            participantId: participantA.id,
          }),
        ],
      });

      const result = generate({
        meetings: [createMeeting(), otherMeeting],
        participants: [participantA, participantB],
        distributionMode: "BALANCED",
      });

      expect(result.meetings[0].assignments[0].participantId).toBe(
        participantB.id,
      );
    });
  });

  describe("Vagas pendentes", () => {
    it("deve contabilizar vagas quando não existem participantes suficientes", () => {
      const result = generate({
        activities: [
          createActivity({
            requiredParticipants: 3,
          }),
        ],
        participants: [createParticipant()],
      });

      expect(result.meetings[0].assignments).toHaveLength(1);

      expect(result.summary.unfilledPositions).toBe(2);
    });
  });

  describe("Regras críticas de regeneração", () => {
    it("não deve atribuir atividades a participantes inativos", () => {
      const result = generate({
        participants: [
          createParticipant({
            id: "participant-1",
            active: false,
          }),
        ],
      });

      expect(result.meetings[0].assignments).toHaveLength(0);
      expect(result.summary.unfilledPositions).toBe(1);
    });

    it("deve respeitar indisponibilidade na data do encontro", () => {
      const result = generate({
        participants: [
          createParticipant({
            id: "participant-1",
            unavailableDates: [DATE],
          }),
        ],
      });

      expect(result.meetings[0].assignments).toHaveLength(0);
      expect(result.summary.unfilledPositions).toBe(1);
    });

    it("deve respeitar o limite de atividades por participante", () => {
      const result = generate({
        activities: [
          createActivity({
            id: "activity-1",
            order: 1,
          }),
          createActivity({
            id: "activity-2",
            order: 2,
          }),
        ],
        participants: [
          createParticipant({
            id: "participant-1",
            allowedActivityIds: ["activity-1", "activity-2"],
            maxActivitiesPerMeeting: 1,
          }),
        ],
      });

      const assignments = result.meetings[0].assignments;

      expect(assignments).toHaveLength(1);
      expect(result.summary.unfilledPositions).toBe(1);
    });

    it("não deve modificar outras quintas-feiras", () => {
      const otherMeeting = createMeeting({
        id: "meeting-2",
        date: "2026-11-12",
        assignments: [
          createAssignment({
            id: "assignment-other",
            participantId: "participant-2",
          }),
        ],
      });

      const result = generate({
        meetings: [
          createMeeting({
            id: "meeting-1",
            date: DATE,
            assignments: [],
          }),
          otherMeeting,
        ],
      });

      expect(result.meetings[1]).toEqual(otherMeeting);
    });

    it("deve preservar todas as atribuições no modo FILL_EMPTY", () => {
      const existing = createAssignment({
        id: "assignment-1",
        locked: false,
      });

      const result = generate({
        mode: "FILL_EMPTY",
        meetings: [
          createMeeting({
            assignments: [existing],
          }),
        ],
      });

      expect(result.meetings[0].assignments).toContainEqual(existing);
    });

    it("deve preservar apenas atribuições fixadas válidas no modo PRESERVE_LOCKED", () => {
      const locked = createAssignment({
        id: "assignment-locked",
        participantId: "participant-1",
        locked: true,
      });

      const unlocked = createAssignment({
        id: "assignment-unlocked",
        participantId: "participant-2",
        locked: false,
      });

      const result = generate({
        mode: "PRESERVE_LOCKED",
        activities: [
          createActivity({
            requiredParticipants: 2,
          }),
        ],
        meetings: [
          createMeeting({
            assignments: [locked, unlocked],
          }),
        ],
        participants: [
          createParticipant({
            id: "participant-1",
          }),
          createParticipant({
            id: "participant-2",
          }),
        ],
      });

      const assignments = result.meetings[0].assignments;

      expect(assignments.some((item) => item.id === locked.id)).toBe(true);

      expect(assignments.some((item) => item.id === unlocked.id)).toBe(false);
    });

    it("deve redistribuir todas as atribuições no modo REDISTRIBUTE_ALL", () => {
      const existing = createAssignment({
        id: "assignment-1",
        locked: true,
      });

      const result = generate({
        mode: "REDISTRIBUTE_ALL",
        meetings: [
          createMeeting({
            assignments: [existing],
          }),
        ],
      });

      expect(
        result.meetings[0].assignments.some(
          (assignment) => assignment.id === existing.id,
        ),
      ).toBe(false);
    });
  });
});
