"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
} from "react";
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
  // Method to reset activity timer (for no-op responses)
  resetActivityTimer: () => void;
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

  // Track last activity time for visibility change refresh
  const lastActivityTime = useRef(Date.now());

  // Create callback functions that call all registered callbacks
  const handlePresenterStateRefresh = useCallback(() => {
    presenterStateCallbacks.current.forEach((callback) => callback());
    lastActivityTime.current = Date.now();
  }, []);

  const handleQuestionsRefresh = useCallback(() => {
    questionsCallbacks.current.forEach((callback) => callback());
    lastActivityTime.current = Date.now();
  }, []);

  const handleActivitiesRefresh = useCallback(() => {
    activitiesCallbacks.current.forEach((callback) => callback());
    lastActivityTime.current = Date.now();
  }, []);

  const handleActivityResponsesRefresh = useCallback(() => {
    activityResponsesCallbacks.current.forEach((callback) => callback());
    lastActivityTime.current = Date.now();
  }, []);

  // Function to refresh all data types
  const refreshAllData = useCallback(() => {
    handlePresenterStateRefresh();
    handleQuestionsRefresh();
    handleActivitiesRefresh();
    handleActivityResponsesRefresh();
  }, [
    handlePresenterStateRefresh,
    handleQuestionsRefresh,
    handleActivitiesRefresh,
    handleActivityResponsesRefresh,
  ]);

  // Function to reset activity timer (for no-op responses and other activity)
  const resetActivityTimer = useCallback(() => {
    lastActivityTime.current = Date.now();
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
    resetActivityTimer,
  );

  // Handle visibility change to refresh data after long inactivity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible/focused
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTime.current;
        const timeLimit = 1 * 60 * 1000; // 1 minutes in milliseconds

        if (timeSinceLastActivity > timeLimit) {
          // It's been more than 3 minutes since last activity, refresh all data
          refreshAllData();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAllData]);

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
    resetActivityTimer,
  };

  return (
    <SSEContext.Provider value={contextValue}>{children}</SSEContext.Provider>
  );
}
