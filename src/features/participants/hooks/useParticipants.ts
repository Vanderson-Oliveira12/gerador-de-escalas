import { useEffect, useMemo } from "react";

import { useParticipantStore } from "../stores/participant.store";

export function useParticipants(search = "") {
  const participants = useParticipantStore((state) => state.participants);

  const loading = useParticipantStore((state) => state.loading);

  const saving = useParticipantStore((state) => state.saving);

  const error = useParticipantStore((state) => state.error);

  const fetchParticipants = useParticipantStore(
    (state) => state.fetchParticipants,
  );

  const createParticipant = useParticipantStore(
    (state) => state.createParticipant,
  );

  const updateParticipant = useParticipantStore(
    (state) => state.updateParticipant,
  );

  const deleteParticipant = useParticipantStore(
    (state) => state.deleteParticipant,
  );

  useEffect(() => {
    void fetchParticipants();
  }, [fetchParticipants]);

  const filteredParticipants = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    if (!normalizedSearch) {
      return participants;
    }

    return participants.filter((participant) =>
      participant.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
    );
  }, [participants, search]);

  return {
    participants: filteredParticipants,

    total: participants.length,

    activeCount: participants.filter((participant) => participant.active)
      .length,

    loading,
    saving,
    error,

    createParticipant,
    updateParticipant,
    deleteParticipant,
    refresh: fetchParticipants,
  };
}
