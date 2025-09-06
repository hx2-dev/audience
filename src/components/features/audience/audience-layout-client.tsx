"use client";

import { SSEProvider } from "~/components/providers/sse-provider";
import { AudienceLayoutHeader } from "~/components/features/audience/audience-layout-header";
import { useEvent } from "~/components/providers/event-provider";

interface AudienceLayoutClientProps {
  children: React.ReactNode;
}

export function AudienceLayoutClient({ children }: AudienceLayoutClientProps) {
  const { shortId } = useEvent();

  return (
    <SSEProvider shortId={shortId}>
      <AudienceLayoutHeader />
      {children}
    </SSEProvider>
  );
}