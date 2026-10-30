import { Link } from "react-router-dom";
import { ListTodo, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Configurações</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Personalize o funcionamento do LAR.
        </p>
      </div>

      <Button
        variant="outline"
        render={<Link to="/activities" />}
        className="h-14 w-full justify-between rounded-2xl bg-card"
      >
        <span className="flex items-center gap-3">
          <ListTodo className="size-5" />
          Gerenciar atividades
        </span>

        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
