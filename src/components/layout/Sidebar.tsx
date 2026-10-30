import { HeartHandshake } from "lucide-react";
import { NavLink } from "react-router-dom";

import { navigationItems } from "./navigation.config";

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-20 items-center gap-3 border-b border-border px-6">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary">
          <HeartHandshake
            className="size-6 text-primary-foreground"
            strokeWidth={1.8}
          />
        </div>

        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            LAR
          </h1>

          <p className="text-xs text-muted-foreground">Gestão de escalas</p>
        </div>
      </div>

      <nav
        aria-label="Navegação principal"
        className="flex-1 space-y-1 overflow-y-auto p-4"
      >
        {navigationItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              [
                "flex min-h-12 items-center gap-3 rounded-xl px-4",
                "text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-ring",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              ].join(" ")
            }
          >
            <Icon className="size-5 shrink-0" strokeWidth={1.8} />

            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-5">
        <p className="text-xs text-muted-foreground">
          LAR — Gestão de encontros
        </p>
      </div>
    </aside>
  );
}
