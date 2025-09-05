"use client";

import { AudienceHeader } from "~/components/features/audience/audience-header";
import { useEvent } from "~/components/providers/event-provider";
import { useMultiSSEQuery } from "~/components/hooks/use-sse-query";

export function AudienceLayoutHeader() {
  const { event, shortId } = useEvent();

  // SSE connection status - just for connection status display, no queries to refresh
  const { isConnected, usingPolling } = useMultiSSEQuery(
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
    <div className="mx-auto max-w-2xl">
      <AudienceHeader
        event={event}
        shortId={shortId}
        isConnected={isConnected}
        usingPolling={usingPolling}
      />
    </div>
  );
}