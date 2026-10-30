import type { Activity } from "@/features/activities/types/activity.types";

type DefaultActivity = Omit<Activity, "createdAt" | "updatedAt">;

export const DEFAULT_ACTIVITIES: DefaultActivity[] = [
  {
    id: "welcome",
    name: "Boas-vindas e oração inicial",
    durationMinutes: 1,
    order: 0,
    requiredParticipants: 1,
    active: true,
  },
  {
    id: "worship",
    name: "Louvor",
    durationMinutes: 4,
    order: 1,
    requiredParticipants: 1,
    active: true,
  },
  {
    id: "miracles",
    name: "Momento de milagres",
    durationMinutes: 10,
    order: 2,
    requiredParticipants: 1,
    active: true,
  },
  {
    id: "icebreaker",
    name: "Quebra-gelo",
    durationMinutes: 3,
    order: 3,
    requiredParticipants: 1,
    active: true,
  },
  {
    id: "offering",
    name: "Oferta",
    durationMinutes: 5,
    order: 4,
    requiredParticipants: 1,
    active: true,
  },
  {
    id: "discipleship",
    name: "Discipulado",
    durationMinutes: 20,
    order: 5,
    requiredParticipants: 1,
    active: true,
  },
  {
    id: "appeal",
    name: "Apelo",
    durationMinutes: 2,
    order: 6,
    requiredParticipants: 1,
    active: true,
  },
  {
    id: "announcements",
    name: "Avisos",
    durationMinutes: 1,
    order: 7,
    requiredParticipants: 1,
    active: true,
  },
];
