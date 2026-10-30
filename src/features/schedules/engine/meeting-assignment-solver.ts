import type { Activity } from "@/features/activities/types/activity.types";

import type { Participant } from "@/features/participants/types/participant.types";

import type { ScheduleAssignment } from "../types/schedule.types";

import { activityWorkloadKey, type WorkloadStats } from "./workload-calculator";

interface SolveMeetingInput {
  date: string;
  participants: Participant[];
  activities: Activity[];
  lockedAssignments: ScheduleAssignment[];
  defaultMaxActivitiesPerMeeting: number;
  mode: "BALANCED" | "RANDOM";
  workload: WorkloadStats;
  random: () => number;
}

export interface SolvedAssignment {
  activityId: string;
  participantId: string;
}

interface Edge {
  to: number;
  reverse: number;
  capacity: number;
  cost: number;
}

class MinCostMaxFlow {
  private graph: Edge[][] = [];

  addNode(): number {
    this.graph.push([]);
    return this.graph.length - 1;
  }

  addEdge(from: number, to: number, capacity: number, cost: number): Edge {
    const forward: Edge = {
      to,
      reverse: this.graph[to].length,
      capacity,
      cost,
    };

    const backward: Edge = {
      to: from,
      reverse: this.graph[from].length,
      capacity: 0,
      cost: -cost,
    };

    this.graph[from].push(forward);
    this.graph[to].push(backward);

    return forward;
  }

  solve(source: number, sink: number): void {
    const size = this.graph.length;

    while (true) {
      const distance = Array<number>(size).fill(Infinity);
      const previousNode = Array<number>(size).fill(-1);
      const previousEdge = Array<number>(size).fill(-1);

      distance[source] = 0;

      // Bellman-Ford permite lidar com as arestas
      // reversas de custo negativo da rede residual.
      for (let iteration = 0; iteration < size - 1; iteration++) {
        let changed = false;

        for (let node = 0; node < size; node++) {
          if (!Number.isFinite(distance[node])) continue;

          for (
            let edgeIndex = 0;
            edgeIndex < this.graph[node].length;
            edgeIndex++
          ) {
            const edge = this.graph[node][edgeIndex];

            if (edge.capacity <= 0) continue;

            const nextDistance = distance[node] + edge.cost;

            if (nextDistance < distance[edge.to]) {
              distance[edge.to] = nextDistance;
              previousNode[edge.to] = node;
              previousEdge[edge.to] = edgeIndex;
              changed = true;
            }
          }
        }

        if (!changed) break;
      }

      if (previousNode[sink] === -1) break;

      let amount = Infinity;

      for (let node = sink; node !== source; node = previousNode[node]) {
        const previous = previousNode[node];
        const edge = this.graph[previous][previousEdge[node]];

        amount = Math.min(amount, edge.capacity);
      }

      for (let node = sink; node !== source; node = previousNode[node]) {
        const previous = previousNode[node];
        const edge = this.graph[previous][previousEdge[node]];

        edge.capacity -= amount;

        this.graph[node][edge.reverse].capacity += amount;
      }
    }
  }
}

function safeRandom(random: () => number): number {
  const value = random();

  if (!Number.isFinite(value)) return 0;

  return Math.min(Math.max(value, 0), 0.999999999);
}

export function solveMeetingAssignments({
  date,
  participants,
  activities,
  lockedAssignments,
  defaultMaxActivitiesPerMeeting,
  mode,
  workload,
  random,
}: SolveMeetingInput): SolvedAssignment[] {
  const activeActivities = activities.filter((activity) => activity.active);

  const activeParticipants = participants.filter(
    (participant) =>
      participant.active && !participant.unavailableDates.includes(date),
  );

  const lockedByActivity = new Map<string, number>();
  const lockedByParticipant = new Map<string, number>();

  const lockedPairs = new Set<string>();

  for (const assignment of lockedAssignments) {
    lockedByActivity.set(
      assignment.activityId,
      (lockedByActivity.get(assignment.activityId) ?? 0) + 1,
    );

    lockedByParticipant.set(
      assignment.participantId,
      (lockedByParticipant.get(assignment.participantId) ?? 0) + 1,
    );

    lockedPairs.add(
      JSON.stringify([assignment.activityId, assignment.participantId]),
    );
  }

  const network = new MinCostMaxFlow();

  const source = network.addNode();
  const sink = network.addNode();

  const participantNodes = new Map<string, number>();

  // Cada participante possui capacidade residual.
  // As arestas paralelas representam a 1ª, 2ª, 3ª...
  // nova atribuição dentro do mesmo encontro.
  for (const participant of activeParticipants) {
    const limit =
      participant.maxActivitiesPerMeeting ?? defaultMaxActivitiesPerMeeting;

    const alreadyLocked = lockedByParticipant.get(participant.id) ?? 0;

    const remaining = Math.max(0, limit - alreadyLocked);

    if (remaining === 0) continue;

    const node = network.addNode();

    participantNodes.set(participant.id, node);

    const historicalLoad = workload.total.get(participant.id) ?? 0;

    for (let index = 0; index < remaining; index++) {
      const meetingPosition = alreadyLocked + index;

      const cost =
        mode === "BALANCED"
          ? // Penaliza concentração histórica.
            (historicalLoad + index) * 100 +
            // Penaliza várias atividades no encontro.
            meetingPosition * 250
          : 0;

      network.addEdge(node, sink, 1, cost);
    }
  }

  interface CandidateEdge {
    activityId: string;
    participantId: string;
    edge: Edge;
  }

  const candidateEdges: CandidateEdge[] = [];

  // Cada vaga possui um nó próprio.
  // O nó intermediário atividade/pessoa garante
  // que uma pessoa ocupe no máximo uma vaga
  // da mesma atividade.
  for (const activity of activeActivities) {
    const alreadyLocked = lockedByActivity.get(activity.id) ?? 0;

    const missing = Math.max(0, activity.requiredParticipants - alreadyLocked);

    if (missing === 0) continue;

    const candidates = activeParticipants.filter(
      (participant) =>
        participantNodes.has(participant.id) &&
        participant.allowedActivityIds.includes(activity.id) &&
        !lockedPairs.has(JSON.stringify([activity.id, participant.id])),
    );

    const pairNodes = candidates.map((participant) => {
      const node = network.addNode();

      const participantNode = participantNodes.get(participant.id)!;

      network.addEdge(node, participantNode, 1, 0);

      return { participant, node };
    });

    for (let position = 0; position < missing; position++) {
      const slotNode = network.addNode();

      network.addEdge(source, slotNode, 1, 0);

      for (const { participant, node } of pairNodes) {
        const activityLoad =
          workload.byActivity.get(
            activityWorkloadKey(participant.id, activity.id),
          ) ?? 0;

        const randomCost = Math.floor(safeRandom(random) * 100);

        const cost =
          mode === "BALANCED" ? activityLoad * 30 + randomCost : randomCost;

        const edge = network.addEdge(slotNode, node, 1, cost);

        candidateEdges.push({
          activityId: activity.id,
          participantId: participant.id,
          edge,
        });
      }
    }
  }

  network.solve(source, sink);

  const result: SolvedAssignment[] = [];

  for (const candidate of candidateEdges) {
    // Uma aresta originalmente com capacidade 1
    // passa a 0 quando recebe fluxo.
    if (candidate.edge.capacity === 0) {
      result.push({
        activityId: candidate.activityId,
        participantId: candidate.participantId,
      });
    }
  }

  return result;
}
