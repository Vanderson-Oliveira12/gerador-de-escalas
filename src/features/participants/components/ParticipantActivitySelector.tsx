import { Check, ListTodo } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

export interface ActivityOption {
  id: string;
  name: string;
}

interface ParticipantActivitySelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  activities: ActivityOption[];
  disabled?: boolean;
}

export function ParticipantActivitySelector({
  value,
  onChange,
  activities,
  disabled = false,
}: ParticipantActivitySelectorProps) {
  function handleToggle(activityId: string) {
    if (disabled) return;

    const exists = value.includes(activityId);

    if (exists) {
      onChange(value.filter((id) => id !== activityId));
      return;
    }

    onChange([...value, activityId]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent">
          <ListTodo className="size-5 text-accent-foreground" />
        </div>

        <div>
          <h3 className="font-heading text-base font-semibold text-foreground">
            Atividades permitidas
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Selecione os momentos em que esta pessoa poderá servir.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {activities.map((activity) => {
          const checked = value.includes(activity.id);

          return (
            <label
              key={activity.id}
              className={[
                "flex min-h-14 cursor-pointer items-center gap-3",
                "rounded-2xl border p-4 transition-colors",
                checked
                  ? "border-lar-green bg-accent"
                  : "border-border bg-card hover:bg-secondary",
                disabled ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => handleToggle(activity.id)}
              />

              <span className="flex-1 text-sm font-medium text-foreground">
                {activity.name}
              </span>

              {checked && <Check className="size-4 text-lar-green" />}
            </label>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length} atividade(s) selecionada(s).
      </p>
    </div>
  );
}
