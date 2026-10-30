import type { Participant } from "@/features/participants/types/participant.types";

import type { DistributionMode } from "../types/schedule.types";

import type { WorkloadMap } from "./workload-calculator";

interface SelectParticipantInput {
  candidates: Participant[];
  mode: DistributionMode;
  workload: WorkloadMap;
  random?: () => number;
}

export function selectParticipant({
  candidates,
  mode,
  workload,
  random = Math.random,
}: SelectParticipantInput): Participant | null {
  if (candidates.length === 0) {
    return null;
  }

  if (mode === "RANDOM") {
    const index = Math.floor(random() * candidates.length);

    return candidates[index];
  }

  const minWorkload = Math.min(
    ...candidates.map((participant) => workload.get(participant.id) ?? 0),
  );

  const leastBusy = candidates.filter(
    (participant) => (workload.get(participant.id) ?? 0) === minWorkload,
  );

  const index = Math.floor(random() * leastBusy.length);

  return leastBusy[index];
}
