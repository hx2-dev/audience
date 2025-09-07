"use client";

import { PresenterHeader } from "~/components/features/presenter/presenter-header";
import { usePresenterEvent } from "~/components/providers/presenter-event-provider";
import { usePresenterStateRealtime } from "~/components/hooks/use-presenter-state-realtime";

export function PresenterLayoutHeader() {
  const { event } = usePresenterEvent();

  // Realtime connection status - just for connection status display  
  const { isConnected } = usePresenterStateRealtime({
    eventId: event.id,
    enabled: !!event.id,
  });

  return (
    <PresenterHeader
      event={event}
      isConnected={isConnected}
    />
  );
}