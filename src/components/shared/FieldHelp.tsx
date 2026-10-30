import { useState } from "react";
import { CircleHelp } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FieldHelpProps {
  content: string;
  label: string;
}

export function FieldHelp({ content, label }: FieldHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        type="button"
        aria-label={`Ajuda: ${label}`}
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="
          inline-flex size-7 shrink-0
          cursor-pointer items-center justify-center
          rounded-full text-muted-foreground
          transition-colors
          hover:bg-secondary hover:text-foreground
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-ring
        "
      >
        <CircleHelp className="size-4" />
      </TooltipTrigger>

      <TooltipContent
        side="top"
        sideOffset={8}
        className="
          max-w-[280px]
          whitespace-normal
          text-left text-sm
          leading-relaxed
        "
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
