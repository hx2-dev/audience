import { useCallback, useRef } from "react";
import { useEventSSE, type UseEventSSEReturn } from "./use-event-sse";

type EventType = "presenter-state" | "questions" | "activities" | "activity-responses";

interface UseSSEQueryOptions {
  shortId?: string;
  enabled?: boolean;
}

// Generic hook for automatic tRPC query + SSE integration
export function useSSEQuery(
  queryResult: { refetch: () => void | Promise<void> },
  eventType: EventType,
  options: UseSSEQueryOptions = {}
): UseEventSSEReturn {
  const { shortId, enabled = true } = options;
  const refetchRef = useRef(queryResult.refetch);
  
  // Keep refetch function current
  refetchRef.current = queryResult.refetch;

  // Create callbacks object with only the needed event type
  const callbacks = useCallback(() => {
    const callbackMap = {
      "presenter-state": "onPresenterStateRefresh",
      "questions": "onQuestionsRefresh", 
      "activities": "onActivitiesRefresh",
      "activity-responses": "onActivityResponsesRefresh",
    } as const;

    const callbackKey = callbackMap[eventType];
    
    return {
      [callbackKey]: () => void refetchRef.current(),
    };
  }, [eventType]);

  return useEventSSE({
    shortId,
    callbacks: callbacks(),
    enabled: enabled && !!shortId,
  });
}

// Specific hooks for each event type
export function usePresenterStateSSE(
  queryResult: { refetch: () => void | Promise<void> },
  shortId?: string,
  enabled = true
) {
  return useSSEQuery(queryResult, "presenter-state", { shortId, enabled });
}

export function useQuestionsSSE(
  queryResult: { refetch: () => void | Promise<void> },
  shortId?: string,
  enabled = true
) {
  return useSSEQuery(queryResult, "questions", { shortId, enabled });
}

export function useActivitiesSSE(
  queryResult: { refetch: () => void | Promise<void> },
  shortId?: string,
  enabled = true
) {
  return useSSEQuery(queryResult, "activities", { shortId, enabled });
}

export function useActivityResponsesSSE(
  queryResult: { refetch: () => void | Promise<void> },
  shortId?: string,
  enabled = true
) {
  return useSSEQuery(queryResult, "activity-responses", { shortId, enabled });
}

// Multi-query SSE hook for when you need to listen to multiple event types
export function useMultiSSEQuery(
  queries: Array<{
    queryResult: { refetch: () => void | Promise<void> };
    eventType: EventType;
  }>,
  shortId?: string,
  enabled = true
): UseEventSSEReturn {
  const queriesRef = useRef(queries);
  queriesRef.current = queries;

  const callbacks = useCallback(() => {
    const callbackObj: Record<string, () => void> = {};
    
    const callbackMap = {
      "presenter-state": "onPresenterStateRefresh",
      "questions": "onQuestionsRefresh",
      "activities": "onActivitiesRefresh", 
      "activity-responses": "onActivityResponsesRefresh",
    } as const;

    // Create callbacks for each unique event type
    const eventTypes = [...new Set(queriesRef.current.map(q => q.eventType))];
    
    eventTypes.forEach(eventType => {
      const callbackKey = callbackMap[eventType];
      const relevantQueries = queriesRef.current.filter(q => q.eventType === eventType);
      
      callbackObj[callbackKey] = () => {
        relevantQueries.forEach(q => void q.queryResult.refetch());
      };
    });

    return callbackObj;
  }, []);

  return useEventSSE({
    shortId,
    callbacks: callbacks(),
    enabled: enabled && !!shortId,
  });
}