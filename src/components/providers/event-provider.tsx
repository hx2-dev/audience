"use client";

import { createContext, useContext } from "react";
import type { Event } from "~/core/features/events/types";
import type { AuthSession } from "~/core/generic/auth/supabase-config";

interface EventContextType {
  event: Event;
  shortId: string;
  session: AuthSession;
}

const EventContext = createContext<EventContextType | null>(null);

interface EventProviderProps {
  event: Event;
  shortId: string;
  session: AuthSession;
  children: React.ReactNode;
}

export function EventProvider({ event, shortId, session, children }: EventProviderProps) {
  return (
    <EventContext.Provider value={{ event, shortId, session }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent(): EventContextType {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
}