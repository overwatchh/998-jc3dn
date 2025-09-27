"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FaqItemProps {
  q: string;
  a: string | React.ReactNode;
  defaultOpen?: boolean;
}

function FaqItem({ q, a, defaultOpen = false }: FaqItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm transition-colors"
    >
      <CollapsibleTrigger className="group focus-visible:ring-ring focus-visible:ring-offset-background hover:bg-muted/40 flex w-full items-center gap-3 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:px-6">
        <span className="flex-1 text-sm font-medium md:text-base">{q}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-5 shrink-0 transition-transform duration-300",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-5 pt-0 pb-5 md:px-6">
        <div className="text-muted-foreground text-sm leading-relaxed md:text-base">
          {a}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const faqItems: FaqItemProps[] = [
  {
    q: "I don’t see the camera permission prompt anymore. How do I enable it?",
    a: (
      <span>
        Click the site info (lock) icon in your browser’s address bar, locate
        Camera, and set it to Allow. Then refresh the page and open Scan again.
      </span>
    ),
  },
  {
    q: "My first scan worked but the second window never appeared. What now?",
    a: "The second window is time-based. Stay on the session; if it has closed already you’ll keep the first (partial) credit. If this keeps happening, notify your lecturer with the session date/time.",
  },
  {
    q: "The QR code won’t scan / stays blurry.",
    a: "Clean your camera lens, move closer (but keep the full code visible), or increase screen brightness if scanning from a screen. Lock device orientation if it keeps refocusing.",
  },
  {
    q: "I missed the first scan. Can I still get attendance?",
    a: "You can still perform the second check‑in (manual or QR depending on instructions) but it will grant reduced credit because the initial presence wasn’t verified.",
  },
  {
    q: "Manual check‑in button is disabled or missing.",
    a: "You might be outside the allowed second window or the lecturer disabled manual mode. Refresh the page after the announced start time, and if still missing, contact the lecturer.",
  },
  {
    q: "I performed both scans but attendance doesn’t show 90%.",
    a: "There can be a short processing delay. If after a few minutes it still shows partial credit, re-open the session page or log out/in. Persistent issues should be reported to support.",
  },
];

export { FaqItem, faqItems };
