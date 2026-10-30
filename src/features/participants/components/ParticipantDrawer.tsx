import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

import type { Participant } from "../types/participant.types";

import type { ParticipantFormValues } from "../schemas/participant.schema";

import { ParticipantForm } from "./ParticipantForm";

import type { ActivityOption } from "./ParticipantActivitySelector";

interface ParticipantDrawerProps {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  participant?: Participant | null;

  activities: ActivityOption[];

  loading?: boolean;

  onSubmit: (values: ParticipantFormValues) => Promise<void>;
}

export function ParticipantDrawer({
  open,
  onOpenChange,
  participant,
  activities,
  loading,
  onSubmit,
}: ParticipantDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex max-h-[95dvh] flex-col">
        <DrawerHeader className="shrink-0">
          <DrawerTitle>
            {participant ? "Editar participante" : "Novo participante"}
          </DrawerTitle>

          <DrawerDescription>
            Configure as informações e atividades permitidas.
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
          <ParticipantForm
            participant={participant}
            activities={activities}
            loading={loading}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
