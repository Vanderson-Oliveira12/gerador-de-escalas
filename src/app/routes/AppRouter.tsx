import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";

import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { ParticipantsPage } from "@/features/participants/pages/ParticipantsPage";
import { ActivitiesPage } from "@/features/activities/pages/ActivitiesPage";
import { SchedulesPage } from "@/features/schedules/pages/SchedulesPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="schedules" element={<SchedulesPage />} />

          <Route path="participants" element={<ParticipantsPage />} />

          <Route path="activities" element={<ActivitiesPage />} />

          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
