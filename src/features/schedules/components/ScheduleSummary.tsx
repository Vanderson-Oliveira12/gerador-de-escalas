import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  UsersRound,
} from "lucide-react";

import type { ScheduleGenerationResult } from "../types/schedule.types";

interface ScheduleSummaryProps {
  result: ScheduleGenerationResult;
}

export function ScheduleSummary({ result }: ScheduleSummaryProps) {
  const uniqueParticipants = new Set(
    result.schedules.flatMap((meeting) =>
      meeting.assignments.map((assignment) => assignment.participantId),
    ),
  ).size;

  const stats = [
    {
      label: "Encontros",
      value: result.stats.totalMeetings,
      icon: CalendarDays,
    },
    {
      label: "Vagas preenchidas",
      value: result.stats.totalAssignments,
      icon: CheckCircle2,
    },
    {
      label: "Vagas pendentes",
      value: result.stats.unfilledPositions,
      icon: AlertTriangle,
    },
    {
      label: "Pessoas escaladas",
      value: uniqueParticipants,
      icon: UsersRound,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <Icon className="size-5 text-muted-foreground" />

          <p className="mt-4 font-heading text-3xl font-semibold">{value}</p>

          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </section>
  );
}
