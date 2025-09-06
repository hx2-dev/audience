"use client";

import { createContext, useContext, useCallback, useRef } from "react";
import { useMultiSSEQuery } from "~/components/hooks/use-sse-query";

interface SSEContextValue {
  isConnected: boolean;
  usingPolling: boolean;
  error: string | null;
  // Methods to register callbacks for different event types
  onPresenterStateRefresh: (callback: () => void) => () => void;
  onQuestionsRefresh: (callback: () => void) => () => void;
  onActivitiesRefresh: (callback: () => void) => () => void;
  onActivityResponsesRefresh: (callback: () => void) => () => void;
}

const SSEContext = createContext<SSEContextValue | null>(null);

export const useSSE = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error("useSSE must be used within an SSEProvider");
  }
  return context;
};

interface SSEProviderProps {
  shortId: string;
  children: React.ReactNode;
}

export function SSEProvider({ shortId, children }: SSEProviderProps) {
  // Store callbacks for each event type
  const presenterStateCallbacks = useRef(new Set<() => void>());
  const questionsCallbacks = useRef(new Set<() => void>());
  const activitiesCallbacks = useRef(new Set<() => void>());
  const activityResponsesCallbacks = useRef(new Set<() => void>());

  // Create callback functions that call all registered callbacks
  const handlePresenterStateRefresh = useCallback(() => {
    presenterStateCallbacks.current.forEach(callback => callback());
  }, []);

  const handleQuestionsRefresh = useCallback(() => {
    questionsCallbacks.current.forEach(callback => callback());
  }, []);

  const handleActivitiesRefresh = useCallback(() => {
    activitiesCallbacks.current.forEach(callback => callback());
  }, []);

  const handleActivityResponsesRefresh = useCallback(() => {
    activityResponsesCallbacks.current.forEach(callback => callback());
  }, []);

  // Single SSE connection for all event types
  const { isConnected, usingPolling, error } = useMultiSSEQuery(
    [
      {
        queryResult: { refetch: handlePresenterStateRefresh },
        eventType: "presenter-state",
      },
      {
        queryResult: { refetch: handleQuestionsRefresh },
        eventType: "questions",
      },
      {
        queryResult: { refetch: handleActivitiesRefresh },
        eventType: "activities",
      },
      {
        queryResult: { refetch: handleActivityResponsesRefresh },
        eventType: "activity-responses",
      },
    ],
    shortId,
    !!shortId,
  );

  // Methods to register/unregister callbacks
  const onPresenterStateRefresh = useCallback((callback: () => void) => {
    presenterStateCallbacks.current.add(callback);
    return () => presenterStateCallbacks.current.delete(callback);
  }, []);

  const onQuestionsRefresh = useCallback((callback: () => void) => {
    questionsCallbacks.current.add(callback);
    return () => questionsCallbacks.current.delete(callback);
  }, []);

  const onActivitiesRefresh = useCallback((callback: () => void) => {
    activitiesCallbacks.current.add(callback);
    return () => activitiesCallbacks.current.delete(callback);
  }, []);

  const onActivityResponsesRefresh = useCallback((callback: () => void) => {
    activityResponsesCallbacks.current.add(callback);
    return () => activityResponsesCallbacks.current.delete(callback);
  }, []);

  const contextValue: SSEContextValue = {
    isConnected,
    usingPolling,
    error,
    onPresenterStateRefresh,
    onQuestionsRefresh,
    onActivitiesRefresh,
    onActivityResponsesRefresh,
  };

  return (
    <SSEContext.Provider value={contextValue}>
      {children}
    </SSEContext.Provider>
  );
}