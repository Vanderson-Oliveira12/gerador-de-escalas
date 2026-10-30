import { NavLink } from "react-router-dom";

import { navigationItems } from "./navigation.config";

export function BottomNavigation() {
  const items = navigationItems.filter((item) => item.showOnMobile);

  return (
    <nav
      aria-label="Navegação mobile"
      className="
        fixed inset-x-0 bottom-0 z-50
        border-t border-border bg-card/95
        backdrop-blur-md lg:hidden
      "
    >
      <div
        className="
          mx-auto flex max-w-lg items-stretch
          justify-around px-2 pt-2
          pb-[calc(env(safe-area-inset-bottom)+0.5rem)]
        "
      >
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              [
                "flex min-h-14 min-w-0 flex-1 flex-col",
                "items-center justify-center gap-1 rounded-xl",
                "text-[11px] font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-ring",
                isActive
                  ? "bg-primary/30 text-foreground"
                  : "text-muted-foreground hover:bg-accent",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="size-5"
                  strokeWidth={isActive ? 2.3 : 1.8}
                  aria-hidden="true"
                />

                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
