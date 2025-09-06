"use client";

import { AudienceHeader } from "~/components/features/audience/audience-header";
import { useEvent } from "~/components/providers/event-provider";
import { useSSE } from "~/components/providers/sse-provider";

export function AudienceLayoutHeader() {
  const { event, shortId } = useEvent();
  const { isConnected, usingPolling } = useSSE();

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