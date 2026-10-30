import { describe, expect, it } from "vitest";

import type { Participant } from "@/features/participants/types/participant.types";

import type { MeetingSchedule } from "../types/schedule.types";

import {
  getInactiveParticipantConflicts,
  getParticipantFutureAssignments,
} from "./schedule-conflicts.utils";

const participants = [
  {
    id: "participant-1",
    name: "Vanderson",
    active: false,
  },
  {
    id: "participant-2",
    name: "Bianca",
    active: true,
  },
] as Participant[];

const meetings: MeetingSchedule[] = [
  {
    id: "meeting-1",
    date: "2026-11-05",
    assignments: [
      {
        id: "assignment-1",
        activityId: "activity-1",
        participantId: "participant-1",
        locked: false,
      },
    ],
  },
  {
    id: "meeting-2",
    date: "2026-11-12",
    assignments: [
      {
        id: "assignment-2",
        activityId: "activity-1",
        participantId: "participant-1",
        locked: true,
      },
      {
        id: "assignment-3",
        activityId: "activity-2",
        participantId: "participant-2",
        locked: false,
      },
    ],
  },
];

describe("schedule-conflicts.utils", () => {
  it("identifica atribuições de participantes inativos", () => {
    const conflicts = getInactiveParticipantConflicts({
      meetings,
      participants,
    });

    expect(conflicts).toHaveLength(2);

    expect(
      conflicts.every((conflict) => conflict.participantId === "participant-1"),
    ).toBe(true);
  });

  it("considera apenas encontros a partir da data informada", () => {
    const conflicts = getInactiveParticipantConflicts({
      meetings,
      participants,
      fromDate: "2026-11-10",
    });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].meetingDate).toBe("2026-11-12");
  });

  it("encontra atribuições futuras de um participante", () => {
    const assignments = getParticipantFutureAssignments({
      participantId: "participant-1",
      meetings,
      fromDate: "2026-11-01",
    });

    expect(assignments).toHaveLength(2);
  });

  it("não considera atribuições anteriores à data informada", () => {
    const assignments = getParticipantFutureAssignments({
      participantId: "participant-1",
      meetings,
      fromDate: "2026-11-10",
    });

    expect(assignments).toHaveLength(1);
    expect(assignments[0].meetingDate).toBe("2026-11-12");
  });

  it("não identifica conflitos para participantes ativos", () => {
    const conflicts = getInactiveParticipantConflicts({
      meetings,
      participants: participants.map((participant) => ({
        ...participant,
        active: true,
      })),
    });

    expect(conflicts).toHaveLength(0);
  });

  describe("Alertas de participantes inativos", () => {
    it("deve identificar participantes inativos em escalas futuras", () => {
      const conflicts = getInactiveParticipantConflicts({
        meetings,
        participants,
        fromDate: "2026-11-01",
      });

      expect(conflicts).toHaveLength(2);

      expect(conflicts.map((conflict) => conflict.meetingDate)).toEqual([
        "2026-11-05",
        "2026-11-12",
      ]);
    });

    it("não deve sinalizar escalas anteriores à data atual", () => {
      const conflicts = getInactiveParticipantConflicts({
        meetings,
        participants,
        fromDate: "2026-11-13",
      });

      expect(conflicts).toHaveLength(0);
    });

    it("não deve sinalizar participantes ativos", () => {
      const conflicts = getInactiveParticipantConflicts({
        meetings,
        participants: participants.filter((participant) => participant.active),
        fromDate: "2026-11-01",
      });

      expect(conflicts).toHaveLength(0);
    });

    it("deve retornar o nome do participante inativo", () => {
      const conflicts = getInactiveParticipantConflicts({
        meetings,
        participants,
        fromDate: "2026-11-01",
      });

      expect(conflicts[0]).toMatchObject({
        participantId: "participant-1",
        participantName: "Vanderson",
        meetingDate: "2026-11-05",
      });
    });

    it("deve identificar atribuições fixadas de participantes inativos", () => {
      const conflicts = getInactiveParticipantConflicts({
        meetings,
        participants,
        fromDate: "2026-11-10",
      });

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].assignmentId).toBe("assignment-2");
    });
  });
});
