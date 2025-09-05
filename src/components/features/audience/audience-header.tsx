"use client";

import { Badge } from "~/components/ui/badge";
import type { Event } from "~/core/features/events/types";

interface AudienceHeaderProps {
  event: Event | undefined;
  shortId: string;
  isConnected: boolean;
  usingPolling: boolean;
}

export function AudienceHeader({
  event,
  shortId,
  isConnected,
  usingPolling,
}: AudienceHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-bold break-words sm:text-2xl lg:text-3xl">
        {event?.title ?? `Event: ${shortId.toUpperCase()}`}
      </h1>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Badge
          variant={isConnected ? "default" : "secondary"}
          className="shrink-0"
        >
          {isConnected
            ? usingPolling
              ? "Connected (Polling)"
              : "Connected"
            : "Connecting..."}
        </Badge>
      </div>
    </div>
  );
}