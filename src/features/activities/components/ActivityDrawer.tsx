import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import type { Activity } from "../types/activity.types";
import type { ActivityFormValues } from "../schemas/activity.schema";

import { ActivityForm } from "./ActivityForm";

interface ActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
  nextOrder: number;
  loading?: boolean;
  onSubmit: (values: ActivityFormValues) => Promise<void>;
}

export function ActivityDrawer({
  open,
  onOpenChange,
  activity,
  nextOrder,
  loading,
  onSubmit,
}: ActivityDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[95dvh] flex-col">
        <DrawerHeader className="shrink-0">
          <DrawerTitle>
            {activity ? "Editar atividade" : "Nova atividade"}
          </DrawerTitle>

          <DrawerDescription>
            Configure o momento da programação do LAR.
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
          <ActivityForm
            activity={activity}
            nextOrder={nextOrder}
            loading={loading}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
