import type { Activity } from "../types/activity.types";

export interface ActivityWithTime extends Activity {
  startTime: string;
  endTime: string;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number): string {
  const minutesInDay = 24 * 60;

  const normalized =
    ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;

  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}

export function calculateActivityTimes(
  activities: Activity[],
  meetingStartTime = "19:30",
): ActivityWithTime[] {
  let currentMinutes = timeToMinutes(meetingStartTime);

  return [...activities]
    .filter((activity) => activity.active)
    .sort((a, b) => a.order - b.order)
    .map((activity) => {
      const startTime = minutesToTime(currentMinutes);

      currentMinutes += activity.durationMinutes;

      return {
        ...activity,
        startTime,
        endTime: minutesToTime(currentMinutes),
      };
    });
}
