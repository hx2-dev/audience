"use client";

import { AudienceHeader } from "~/components/features/audience/audience-header";
import { useEvent } from "~/components/providers/event-provider";
import { useAudienceRealtime } from "~/components/providers/audience-realtime-provider";

export function AudienceLayoutHeader() {
  const { event, shortId } = useEvent();

  // Get connection status from unified realtime provider
  const { isConnected } = useAudienceRealtime();

  return (
    <AudienceHeader
      event={event}
      shortId={shortId}
      isConnected={isConnected}
    />
  );
}