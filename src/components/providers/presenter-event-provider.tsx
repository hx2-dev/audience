"use client";

import React, { createContext, useContext } from "react";
import type { Event } from "~/core/features/events/types";
import type { Session } from "next-auth";

interface PresenterEventContextType {
  event: Event;
  eventId: string;
  session: Session;
}

const PresenterEventContext = createContext<PresenterEventContextType | null>(null);

interface PresenterEventProviderProps {
  event: Event;
  eventId: string;
  session: Session;
  children: React.ReactNode;
}

export function PresenterEventProvider({ event, eventId, session, children }: PresenterEventProviderProps) {
  return (
    <PresenterEventContext.Provider value={{ event, eventId, session }}>
      {children}
    </PresenterEventContext.Provider>
  );
}

export function usePresenterEvent(): PresenterEventContextType {
  const context = useContext(PresenterEventContext);
  if (!context) {
    throw new Error("usePresenterEvent must be used within a PresenterEventProvider");
  }
  return context;
}