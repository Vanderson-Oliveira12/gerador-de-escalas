import { describe, expect, it } from "vitest";

import type { Activity } from "@/features/activities/types/activity.types";
import type { Participant } from "@/features/participants/types/participant.types";

import {
  assignParticipant,
  removeAssignment,
  toggleAssignmentLock,
  ScheduleEditError,
  type ScheduleEditContext,
} from "./schedule-editor";

const date = "2026-11-05";

function participant(
  id: string,
  overrides: Partial<Participant> = {},
): Participant {
  return {
    id,
    name: id,
    active: true,
    allowedActivityIds: ["worship", "offering"],
    unavailableDates: [],
    maxActivitiesPerMeeting: null,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function activity(id: string, overrides: Partial<Activity> = {}): Activity {
  return {
    id,
    name: id,
    durationMinutes: 5,
    order: 0,
    requiredParticipants: 1,
    active: true,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function context(): ScheduleEditContext {
  return {
    meetings: [
      {
        id: "meeting-1",
        date,
        assignments: [
          {
            id: "assignment-1",
            activityId: "worship",
            participantId: "joao",
            locked: false,
          },
        ],
      },
    ],
    activities: [activity("worship"), activity("offering")],
    participants: [
      participant("joao"),
      participant("maria"),
      participant("pedro"),
    ],
    defaultMaxActivitiesPerMeeting: 2,
  };
}

describe("Schedule Editor", () => {
  it("substitui o responsável preservando o ID", () => {
    const result = assignParticipant(context(), {
      date,
      activityId: "worship",
      participantId: "maria",
      replaceAssignmentId: "assignment-1",
    });

    expect(result[0].assignments[0]).toMatchObject({
      id: "assignment-1",
      participantId: "maria",
      locked: true,
    });
  });

  it("permite múltiplas atividades dentro do limite", () => {
    const result = assignParticipant(context(), {
      date,
      activityId: "offering",
      participantId: "joao",
    });

    expect(result[0].assignments).toHaveLength(2);
  });

  it("impede participante indisponível", () => {
    const data = context();

    data.participants[1].unavailableDates = [date];

    expect(() =>
      assignParticipant(data, {
        date,
        activityId: "offering",
        participantId: "maria",
      }),
    ).toThrow(ScheduleEditError);
  });

  it("impede atividade não permitida", () => {
    const data = context();

    data.participants[1].allowedActivityIds = ["worship"];

    expect(() =>
      assignParticipant(data, {
        date,
        activityId: "offering",
        participantId: "maria",
      }),
    ).toThrow("não está habilitado");
  });

  it("impede ultrapassar o limite individual", () => {
    const data = context();

    data.participants[0].maxActivitiesPerMeeting = 1;

    expect(() =>
      assignParticipant(data, {
        date,
        activityId: "offering",
        participantId: "joao",
      }),
    ).toThrow("atingiu o limite");
  });

  it("impede preencher uma atividade já completa", () => {
    expect(() =>
      assignParticipant(context(), {
        date,
        activityId: "worship",
        participantId: "maria",
      }),
    ).toThrow("todos os responsáveis");
  });

  it("permite remover uma atribuição", () => {
    const result = removeAssignment(context().meetings, date, "assignment-1");

    expect(result[0].assignments).toHaveLength(0);
  });

  it("permite fixar e desbloquear", () => {
    const first = toggleAssignmentLock(
      context().meetings,
      date,
      "assignment-1",
    );

    expect(first[0].assignments[0].locked).toBe(true);

    const second = toggleAssignmentLock(first, date, "assignment-1");

    expect(second[0].assignments[0].locked).toBe(false);
  });

  it("não modifica os dados originais", () => {
    const original = context();

    assignParticipant(original, {
      date,
      activityId: "worship",
      participantId: "maria",
      replaceAssignmentId: "assignment-1",
    });

    expect(original.meetings[0].assignments[0].participantId).toBe("joao");
  });
});
