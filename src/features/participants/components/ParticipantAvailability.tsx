import { useState } from "react";

import { CalendarDays, Trash2 } from "lucide-react";

import { format, parseISO } from "date-fns";

import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface ParticipantAvailabilityProps {
  value: string[];
  onChange: (dates: string[]) => void;
  disabled?: boolean;
}

export function ParticipantAvailability({
  value,
  onChange,
  disabled = false,
}: ParticipantAvailabilityProps) {
  const [month, setMonth] = useState(new Date());

  const selectedDates = value.map((date) => parseISO(date));

  function handleSelect(dates: Date[] | undefined) {
    if (disabled) return;

    const formatted = (dates ?? [])
      .map((date) => format(date, "yyyy-MM-dd"))
      .sort();

    onChange(formatted);
  }

  function handleRemove(date: string) {
    onChange(value.filter((item) => item !== date));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent">
          <CalendarDays className="size-5 text-accent-foreground" />
        </div>

        <div>
          <h3 className="font-heading text-base font-semibold">
            Indisponibilidades
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Selecione as datas em que esta pessoa não poderá servir.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3">
        <Calendar
          mode="multiple"
          selected={selectedDates}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          locale={ptBR}
          disabled={disabled}
          className="mx-auto"
        />
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Datas indisponíveis ({value.length})
          </p>

          <div className="space-y-2">
            {value.map((date) => (
              <div
                key={date}
                className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3"
              >
                <span className="text-sm text-secondary-foreground">
                  {format(parseISO(date), "dd/MM/yyyy")}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => handleRemove(date)}
                  aria-label={`Remover indisponibilidade de ${date}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
