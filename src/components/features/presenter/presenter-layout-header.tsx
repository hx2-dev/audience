"use client";

import { PresenterHeader } from "~/components/features/presenter/presenter-header";
import { usePresenterEvent } from "~/components/providers/presenter-event-provider";
import { useMultiSSEQuery } from "~/components/hooks/use-sse-query";

export function PresenterLayoutHeader() {
  const { event } = usePresenterEvent();

  // SSE connection status - just for connection status display, no queries to refresh
  const { isConnected } = useMultiSSEQuery(
    [
      {
        queryResult: { refetch: () => {} }, // eslint-disable-line @typescript-eslint/no-empty-function -- No-op since we just want connection status
        eventType: "presenter-state",
      },
    ],
    event.shortId,
    !!event.shortId,
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PresenterHeader
        event={event}
        isConnected={isConnected}
      />
    </div>
  );
}