// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { LocalScheduleRepository } from "./schedule.repository";

import type { SaveMonthlyScheduleInput } from "../types/schedule-persistence.types";

const STORAGE_KEY = "lar:schedules";

function createSchedule(
  overrides: Partial<SaveMonthlyScheduleInput> = {},
): SaveMonthlyScheduleInput {
  return {
    year: 2026,
    month: 11,
    mode: "BALANCED",
    defaultMaxActivitiesPerMeeting: 2,

    meetings: [
      {
        id: "meeting-1",
        date: "2026-11-05",
        assignments: [
          {
            id: "assignment-1",
            activityId: "activity-1",
            participantId: "participant-1",
            locked: true,
          },
        ],
      },
    ],

    snapshots: [
      {
        assignmentId: "assignment-1",
        participantName: "Vanderson",
        activityName: "Louvor",
      },
    ],

    ...overrides,
  };
}

describe("LocalScheduleRepository", () => {
  let repository: LocalScheduleRepository;

  beforeEach(() => {
    localStorage.clear();

    repository = new LocalScheduleRepository();
  });

  it("deve salvar uma escala mensal no localStorage", async () => {
    const schedule = createSchedule();

    await repository.saveMonth(schedule);

    const stored = localStorage.getItem(STORAGE_KEY);

    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].year).toBe(2026);
    expect(parsed[0].month).toBe(11);
  });

  it("deve recuperar uma escala após recriar o repositório", async () => {
    const schedule = createSchedule();

    await repository.saveMonth(schedule);

    // Simula a criação de uma nova instância
    // após o recarregamento da aplicação.
    const reloadedRepository = new LocalScheduleRepository();

    const recovered = await reloadedRepository.findByMonth(2026, 11);

    expect(recovered).not.toBeNull();

    expect(recovered?.meetings).toEqual(schedule.meetings);
    expect(recovered?.snapshots).toEqual(schedule.snapshots);

    expect(recovered?.meetings[0].assignments[0].participantId).toBe(
      "participant-1",
    );
  });

  it("deve preservar atribuições fixadas após recarregar", async () => {
    await repository.saveMonth(createSchedule());

    const reloadedRepository = new LocalScheduleRepository();

    const recovered = await reloadedRepository.findByMonth(2026, 11);

    expect(recovered?.meetings[0].assignments[0].locked).toBe(true);
  });

  it("deve atualizar um mês sem duplicá-lo", async () => {
    const original = await repository.saveMonth(createSchedule());

    const updated = await repository.saveMonth(
      createSchedule({
        meetings: [
          {
            id: "meeting-1",
            date: "2026-11-05",
            assignments: [],
          },
        ],
        snapshots: [],
      }),
    );

    const all = await repository.findAll();

    expect(all).toHaveLength(1);

    expect(updated.id).toBe(original.id);
    expect(updated.createdAt).toBe(original.createdAt);

    expect(updated.meetings[0].assignments).toHaveLength(0);
  });

  it("deve manter escalas de outros meses", async () => {
    await repository.saveMonth(
      createSchedule({
        month: 11,
      }),
    );

    await repository.saveMonth(
      createSchedule({
        month: 12,
      }),
    );

    const all = await repository.findAll();

    expect(all).toHaveLength(2);

    expect(await repository.findByMonth(2026, 11)).not.toBeNull();

    expect(await repository.findByMonth(2026, 12)).not.toBeNull();
  });

  it("deve retornar null quando o mês não existe", async () => {
    const result = await repository.findByMonth(2026, 11);

    expect(result).toBeNull();
  });

  it("deve excluir somente o mês informado", async () => {
    await repository.saveMonth(
      createSchedule({
        month: 11,
      }),
    );

    await repository.saveMonth(
      createSchedule({
        month: 12,
      }),
    );

    await repository.deleteMonth(2026, 11);

    expect(await repository.findByMonth(2026, 11)).toBeNull();

    expect(await repository.findByMonth(2026, 12)).not.toBeNull();
  });

  it("deve retornar lista vazia quando não há escalas", async () => {
    const all = await repository.findAll();

    expect(all).toEqual([]);
  });

  it("deve rejeitar dados inválidos armazenados", async () => {
    localStorage.setItem(STORAGE_KEY, "{json-invalido");

    await expect(repository.findAll()).rejects.toThrow(
      "Não foi possível carregar as escalas armazenadas.",
    );
  });

  it("não deve sobrescrever dados quando a leitura falhar", async () => {
    const invalidData = "{json-invalido";

    localStorage.setItem(STORAGE_KEY, invalidData);

    await expect(repository.saveMonth(createSchedule())).rejects.toThrow();

    expect(localStorage.getItem(STORAGE_KEY)).toBe(invalidData);
  });
});
