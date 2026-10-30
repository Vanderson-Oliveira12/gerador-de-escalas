import { AlertTriangle } from "lucide-react";

import type { ScheduleIssue } from "../types/schedule.types";

interface ScheduleIssuesProps {
  issues: ScheduleIssue[];
}

export function ScheduleIssues({ issues }: ScheduleIssuesProps) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="flex items-center gap-3">
        <AlertTriangle className="size-5 text-amber-600" />

        <div>
          <h3 className="font-heading font-semibold">Pendências encontradas</h3>

          <p className="text-sm text-muted-foreground">
            A escala foi gerada, mas existem situações que precisam de atenção.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {issues.map((issue, index) => (
          <div
            key={`${issue.date}-${issue.activityId}-${index}`}
            className="rounded-xl bg-card p-3 text-sm"
          >
            <span className="font-semibold">{issue.date}</span>

            <p className="mt-1 text-muted-foreground">{issue.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
