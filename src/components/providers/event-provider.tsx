"use client";

import React, { createContext, useContext } from "react";
import type { Event } from "~/core/features/events/types";
import type { Session } from "next-auth";

interface EventContextType {
  event: Event;
  shortId: string;
  session: Session;
}

const EventContext = createContext<EventContextType | null>(null);

interface EventProviderProps {
  event: Event;
  shortId: string;
  session: Session;
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