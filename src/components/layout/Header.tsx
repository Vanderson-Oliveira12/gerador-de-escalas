import { CalendarDays, HeartHandshake } from "lucide-react";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { navigationItems } from "./navigation.config";

export function Header() {
  const location = useLocation();

  const currentPage = navigationItems.find((item) =>
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`),
  );

  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <header
      className="
        sticky top-0 z-40 flex h-16 shrink-0
        items-center justify-between
        border-b border-border bg-card/95
        px-4 backdrop-blur-md
        sm:px-6 lg:h-20 lg:px-8
      "
    >
      {/* Mobile */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary">
          <HeartHandshake
            className="size-5 text-primary-foreground"
            strokeWidth={1.8}
          />
        </div>

        <div>
          <h1 className="font-heading text-lg font-semibold leading-tight">
            LAR
          </h1>

          <p className="text-xs text-muted-foreground">Gestão de escalas</p>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <h2 className="font-heading text-lg font-semibold">
          {currentPage?.label ?? "Gestão de escalas"}
        </h2>

        <p className="text-sm text-muted-foreground">
          Organize os encontros da sua célula.
        </p>
      </div>

      {/* Data */}
      <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-2 sm:px-4">
        <CalendarDays
          className="size-4 text-secondary-foreground"
          strokeWidth={1.8}
        />

        <span className="hidden text-sm font-medium text-secondary-foreground sm:inline">
          {today}
        </span>

        <span className="text-xs font-medium text-secondary-foreground sm:hidden">
          {format(new Date(), "dd/MM", { locale: ptBR })}
        </span>
      </div>
    </header>
  );
}
