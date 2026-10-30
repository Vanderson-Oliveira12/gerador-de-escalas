import { useEffect, useMemo } from "react";

import { useActivityStore } from "../stores/activity.store";

export function useActivities() {
  const activities = useActivityStore((state) => state.activities);

  const loading = useActivityStore((state) => state.loading);

  const saving = useActivityStore((state) => state.saving);

  const error = useActivityStore((state) => state.error);

  const fetchActivities = useActivityStore((state) => state.fetchActivities);

  const createActivity = useActivityStore((state) => state.createActivity);

  const updateActivity = useActivityStore((state) => state.updateActivity);

  const deleteActivity = useActivityStore((state) => state.deleteActivity);

  const resetActivities = useActivityStore((state) => state.resetActivities);

  const reorderActivities = useActivityStore(
    (state) => state.reorderActivities,
  );

  useEffect(() => {
    void fetchActivities();
  }, [fetchActivities]);

  const activeActivities = useMemo(
    () => activities.filter((activity) => activity.active),
    [activities],
  );

  return {
    activities,
    activeActivities,

    total: activities.length,
    activeCount: activeActivities.length,

    loading,
    saving,
    error,
    resetActivities,

    createActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,

    refresh: fetchActivities,
  };
}
