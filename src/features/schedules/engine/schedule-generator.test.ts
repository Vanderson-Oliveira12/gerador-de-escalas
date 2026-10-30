import { describe, expect, it } from "vitest";

import type { Activity } from "@/features/activities/types/activity.types";

import type { Participant } from "@/features/participants/types/participant.types";

import type {
  MeetingSchedule,
  ScheduleGenerationInput,
} from "../types/schedule.types";

import { generateSchedules } from "./schedule-generator";

const now = "2026-10-30T12:00:00.000Z";

function makeActivity(id: string, requiredParticipants = 1): Activity {
  return {
    id,
    name: id,
    durationMinutes: 5,
    order: 0,
    requiredParticipants,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}

function makeParticipant(
  id: string,
  allowedActivityIds: string[],
  options: Partial<Participant> = {},
): Participant {
  return {
    id,
    name: id,
    active: true,
    allowedActivityIds,
    unavailableDates: [],
    maxActivitiesPerMeeting: 1,
    createdAt: now,
    updatedAt: now,
    ...options,
  };
}

function makeInput(
  overrides: Partial<ScheduleGenerationInput> = {},
): ScheduleGenerationInput {
  return {
    year: 2026,
    month: 11,
    mode: "BALANCED",
    defaultMaxActivitiesPerMeeting: 1,
    participants: [],
    activities: [],
    ...overrides,
  };
}

const fixedRandom = () => 0.5;

describe("Schedule Engine v2", () => {
  it("gera todas as quintas-feiras de novembro", () => {
    const result = generateSchedules(makeInput(), fixedRandom);

    expect(result.schedules.map((schedule) => schedule.date)).toEqual([
      "2026-11-05",
      "2026-11-12",
      "2026-11-19",
      "2026-11-26",
    ]);
  });

  it("prioriza preencher todas as vagas possíveis", () => {
    const activities = [
      makeActivity("louvor"),
      makeActivity("quebra-gelo"),
      makeActivity("oferta"),
    ];

    const participants = [
      makeParticipant("joao", ["louvor", "quebra-gelo"]),
      makeParticipant("maria", ["louvor", "oferta"]),
      makeParticipant("beatriz", ["oferta"]),
    ];

    const result = generateSchedules(
      makeInput({ activities, participants }),
      fixedRandom,
    );

    for (const schedule of result.schedules) {
      expect(schedule.assignments).toHaveLength(3);

      const assignments = new Map(
        schedule.assignments.map((assignment) => [
          assignment.activityId,
          assignment.participantId,
        ]),
      );

      expect(assignments.get("quebra-gelo")).toBe("joao");
      expect(assignments.get("oferta")).toBe("beatriz");
      expect(assignments.get("louvor")).toBe("maria");
    }

    expect(result.stats.unfilledPositions).toBe(0);
  });

  it("não escala participantes indisponíveis", () => {
    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor")],
        participants: [
          makeParticipant("joao", ["louvor"], {
            unavailableDates: ["2026-11-12"],
          }),
        ],
      }),
      fixedRandom,
    );

    const meeting = result.schedules.find(
      (schedule) => schedule.date === "2026-11-12",
    );

    expect(meeting?.assignments).toHaveLength(0);
    expect(result.stats.unfilledPositions).toBe(1);
  });

  it("não utiliza participantes inativos", () => {
    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor")],
        participants: [
          makeParticipant("joao", ["louvor"], {
            active: false,
          }),
        ],
      }),
      fixedRandom,
    );

    expect(result.stats.totalAssignments).toBe(0);
    expect(result.stats.unfilledPositions).toBe(4);
  });

  it("respeita o limite por encontro", () => {
    const result = generateSchedules(
      makeInput({
        activities: [
          makeActivity("louvor"),
          makeActivity("oferta"),
          makeActivity("avisos"),
        ],
        participants: [
          makeParticipant("joao", ["louvor", "oferta", "avisos"], {
            maxActivitiesPerMeeting: 2,
          }),
        ],
      }),
      fixedRandom,
    );

    for (const schedule of result.schedules) {
      expect(schedule.assignments).toHaveLength(2);
    }

    expect(result.stats.unfilledPositions).toBe(4);
  });

  it("permite múltiplas atividades diferentes", () => {
    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor"), makeActivity("oferta")],
        participants: [
          makeParticipant("joao", ["louvor", "oferta"], {
            maxActivitiesPerMeeting: 2,
          }),
        ],
      }),
      fixedRandom,
    );

    for (const schedule of result.schedules) {
      expect(schedule.assignments).toHaveLength(2);

      expect(
        new Set(schedule.assignments.map((assignment) => assignment.activityId))
          .size,
      ).toBe(2);
    }
  });

  it("não coloca a mesma pessoa duas vezes na mesma atividade", () => {
    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor", 2)],
        participants: [
          makeParticipant("joao", ["louvor"], {
            maxActivitiesPerMeeting: 3,
          }),
        ],
      }),
      fixedRandom,
    );

    for (const schedule of result.schedules) {
      expect(schedule.assignments).toHaveLength(1);
    }

    expect(result.stats.unfilledPositions).toBe(4);
  });

  it("preserva atribuições manuais bloqueadas", () => {
    const existingSchedules: MeetingSchedule[] = [
      {
        id: "meeting-1",
        date: "2026-11-05",
        assignments: [
          {
            id: "locked-1",
            activityId: "louvor",
            participantId: "joao",
            locked: true,
          },
        ],
      },
    ];

    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor"), makeActivity("oferta")],
        participants: [
          makeParticipant("joao", ["louvor", "oferta"]),
          makeParticipant("maria", ["louvor", "oferta"]),
        ],
        existingSchedules,
      }),
      fixedRandom,
    );

    const meeting = result.schedules[0];

    expect(meeting.id).toBe("meeting-1");

    expect(meeting.assignments).toContainEqual({
      id: "locked-1",
      activityId: "louvor",
      participantId: "joao",
      locked: true,
    });

    expect(meeting.assignments).toHaveLength(2);

    expect(
      meeting.assignments.find(
        (assignment) => assignment.activityId === "oferta",
      )?.participantId,
    ).toBe("maria");
  });

  it("sinaliza atribuições bloqueadas inválidas", () => {
    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor")],
        participants: [
          makeParticipant("joao", ["louvor"], {
            unavailableDates: ["2026-11-05"],
          }),
        ],
        existingSchedules: [
          {
            id: "meeting-1",
            date: "2026-11-05",
            assignments: [
              {
                id: "locked-1",
                activityId: "louvor",
                participantId: "joao",
                locked: true,
              },
            ],
          },
        ],
      }),
      fixedRandom,
    );

    expect(
      result.issues.some((issue) => issue.code === "INVALID_LOCKED_ASSIGNMENT"),
    ).toBe(true);

    expect(result.schedules[0].assignments[0].id).toBe("locked-1");
  });

  it("considera o histórico no balanceamento", () => {
    const historicalAssignments = Array.from({ length: 20 }, (_, index) => ({
      id: `history-${index}`,
      activityId: "louvor",
      participantId: "joao",
      locked: false,
    }));

    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor")],
        participants: [
          makeParticipant("joao", ["louvor"]),
          makeParticipant("maria", ["louvor"]),
        ],
        historicalAssignments,
      }),
      fixedRandom,
    );

    const firstMeeting = result.schedules[0];

    expect(firstMeeting.assignments[0].participantId).toBe("maria");
  });

  it("retorna estatísticas por participante", () => {
    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor")],
        participants: [makeParticipant("joao", ["louvor"])],
      }),
      fixedRandom,
    );

    expect(result.stats.participantDistribution).toEqual([
      {
        participantId: "joao",
        historicalCount: 0,
        generatedCount: 4,
        totalCount: 4,
      },
    ]);
  });

  it("não altera os objetos de entrada", () => {
    const activities = [makeActivity("louvor")];
    const participants = [makeParticipant("joao", ["louvor"])];

    const activitiesSnapshot = JSON.stringify(activities);
    const participantsSnapshot = JSON.stringify(participants);

    generateSchedules(makeInput({ activities, participants }), fixedRandom);

    expect(JSON.stringify(activities)).toBe(activitiesSnapshot);

    expect(JSON.stringify(participants)).toBe(participantsSnapshot);
  });

  it("preenche atividades com múltiplos responsáveis", () => {
    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor", 3)],
        participants: [
          makeParticipant("joao", ["louvor"]),
          makeParticipant("maria", ["louvor"]),
          makeParticipant("beatriz", ["louvor"]),
        ],
      }),
      fixedRandom,
    );

    for (const schedule of result.schedules) {
      expect(schedule.assignments).toHaveLength(3);

      expect(
        new Set(
          schedule.assignments.map((assignment) => assignment.participantId),
        ).size,
      ).toBe(3);
    }

    expect(result.stats.unfilledPositions).toBe(0);
  });

  it("preserva bloqueios mesmo quando excedem as vagas", () => {
    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor", 1)],
        participants: [
          makeParticipant("joao", ["louvor"]),
          makeParticipant("maria", ["louvor"]),
        ],
        existingSchedules: [
          {
            id: "meeting-1",
            date: "2026-11-05",
            assignments: [
              {
                id: "locked-1",
                activityId: "louvor",
                participantId: "joao",
                locked: true,
              },
              {
                id: "locked-2",
                activityId: "louvor",
                participantId: "maria",
                locked: true,
              },
            ],
          },
        ],
      }),
      fixedRandom,
    );

    expect(result.schedules[0].assignments).toHaveLength(2);

    expect(
      result.issues.some((issue) => issue.code === "EXCESS_LOCKED_ASSIGNMENTS"),
    ).toBe(true);
  });

  it("gera corretamente meses com cinco quintas-feiras", () => {
    const result = generateSchedules(
      makeInput({
        year: 2026,
        month: 10,
      }),
      fixedRandom,
    );

    expect(result.schedules).toHaveLength(5);

    expect(result.schedules.map((schedule) => schedule.date)).toEqual([
      "2026-10-01",
      "2026-10-08",
      "2026-10-15",
      "2026-10-22",
      "2026-10-29",
    ]);
  });

  it("funciona no modo RANDOM respeitando restrições", () => {
    const result = generateSchedules(
      makeInput({
        mode: "RANDOM",
        activities: [makeActivity("louvor"), makeActivity("quebra-gelo")],
        participants: [
          makeParticipant("joao", ["louvor", "quebra-gelo"]),
          makeParticipant("beatriz", ["quebra-gelo"]),
        ],
      }),
      () => 0.25,
    );

    expect(result.stats.unfilledPositions).toBe(0);

    for (const schedule of result.schedules) {
      expect(schedule.assignments).toHaveLength(2);

      expect(
        schedule.assignments.find(
          (assignment) => assignment.activityId === "louvor",
        )?.participantId,
      ).toBe("joao");

      expect(
        schedule.assignments.find(
          (assignment) => assignment.activityId === "quebra-gelo",
        )?.participantId,
      ).toBe("beatriz");
    }
  });

  it("não considera atribuições desbloqueadas anteriores", () => {
    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor")],
        participants: [makeParticipant("joao", ["louvor"])],
        existingSchedules: [
          {
            id: "meeting-1",
            date: "2026-11-05",
            assignments: [
              {
                id: "old-assignment",
                activityId: "louvor",
                participantId: "joao",
                locked: false,
              },
            ],
          },
        ],
      }),
      fixedRandom,
    );

    expect(result.schedules[0].assignments).toHaveLength(1);

    expect(result.schedules[0].assignments[0].id).not.toBe("old-assignment");
  });

  it("distribui de forma equilibrada entre participantes equivalentes", () => {
    const result = generateSchedules(
      makeInput({
        activities: [makeActivity("louvor")],
        participants: [
          makeParticipant("joao", ["louvor"]),
          makeParticipant("maria", ["louvor"]),
        ],
      }),
      fixedRandom,
    );

    const counts = result.stats.participantDistribution.map(
      (item) => item.generatedCount,
    );

    expect(Math.abs(counts[0] - counts[1])).toBeLessThanOrEqual(1);
  });
});
