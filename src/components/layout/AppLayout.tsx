import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background lg:flex">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Conteúdo principal */}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <Header />

        <main
          id="main-content"
          className="
            w-full flex-1
            px-4 pt-6
            pb-[calc(6rem+env(safe-area-inset-bottom))]
            sm:px-6 lg:px-8 lg:py-8
          "
        >
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Navegação mobile */}
      <BottomNavigation />
    </div>
  );
}
