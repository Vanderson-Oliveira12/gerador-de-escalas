import { SearchX, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ParticipantEmptyStateProps {
  searching?: boolean;
  onCreate?: () => void;
}

export function ParticipantEmptyState({
  searching = false,
  onCreate,
}: ParticipantEmptyStateProps) {
  const Icon = searching ? SearchX : UsersRound;

  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-accent">
        <Icon className="size-8 text-accent-foreground" />
      </div>

      <h2 className="font-heading text-xl font-semibold text-foreground">
        {searching
          ? "Nenhum resultado encontrado"
          : "Nenhum participante cadastrado"}
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {searching
          ? "Não encontramos participantes com esse nome. Tente outra pesquisa."
          : "Cadastre as pessoas que poderão servir nos encontros do LAR."}
      </p>

      {!searching && onCreate && (
        <Button onClick={onCreate} className="mt-6 rounded-full px-6">
          Cadastrar participante
        </Button>
      )}
    </div>
  );
}
