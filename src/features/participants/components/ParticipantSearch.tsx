import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ParticipantSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ParticipantSearch({ value, onChange }: ParticipantSearchProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Pesquisar participantes..."
        aria-label="Pesquisar participantes"
        className="h-12 rounded-2xl bg-card pr-12 pl-11"
      />

      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange("")}
          aria-label="Limpar pesquisa"
          className="absolute top-1/2 right-2 -translate-y-1/2"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
