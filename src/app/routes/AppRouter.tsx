import { lazy, Suspense } from "react";

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { LoaderCircle } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";

// Lazy Loading das páginas
const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);

const ParticipantsPage = lazy(() =>
  import("@/features/participants/pages/ParticipantsPage").then((module) => ({
    default: module.ParticipantsPage,
  })),
);

const ActivitiesPage = lazy(() =>
  import("@/features/activities/pages/ActivitiesPage").then((module) => ({
    default: module.ActivitiesPage,
  })),
);

const SchedulesPage = lazy(() =>
  import("@/features/schedules/pages/SchedulesPage").then((module) => ({
    default: module.SchedulesPage,
  })),
);

const SettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoaderCircle className="size-7 animate-spin text-lar-dark-green" />

        <p className="text-sm text-muted-foreground">Carregando página...</p>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageLoading />}>
                <DashboardPage />
              </Suspense>
            }
          />

          <Route
            path="schedules"
            element={
              <Suspense fallback={<PageLoading />}>
                <SchedulesPage />
              </Suspense>
            }
          />

          <Route
            path="participants"
            element={
              <Suspense fallback={<PageLoading />}>
                <ParticipantsPage />
              </Suspense>
            }
          />

          <Route
            path="activities"
            element={
              <Suspense fallback={<PageLoading />}>
                <ActivitiesPage />
              </Suspense>
            }
          />

          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoading />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
