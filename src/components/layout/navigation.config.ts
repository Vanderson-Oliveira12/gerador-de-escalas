import {
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  Settings2,
  UsersRound,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Início",
    path: "/",
    icon: LayoutDashboard,
    showOnMobile: true,
  },
  {
    label: "Escalas",
    path: "/schedules",
    icon: CalendarDays,
    showOnMobile: true,
  },
  {
    label: "Pessoas",
    path: "/participants",
    icon: UsersRound,
    showOnMobile: true,
  },
  {
    label: "Atividades",
    path: "/activities",
    icon: ListTodo,
    showOnMobile: false,
  },
  {
    label: "Ajustes",
    path: "/settings",
    icon: Settings2,
    showOnMobile: true,
  },
] as const;
