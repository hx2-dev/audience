import { useEffect, useRef, useState } from "react";

// NOTE: This hook now uses long polling by default instead of SSE.
// Use the new hooks from use-sse-query.ts instead:
// - useSSEQuery, useQuestionsSSE, useActivitiesSSE, etc.
// This hook is maintained for internal use by the new SSE hooks only.

// For backward compatibility, keep the same interface but adapt to polling
export interface SSEMessage {
  type: "connected" | "refresh";
  data?: {
    refreshTypes: Array<"presenter-state" | "questions" | "activities" | "activity-responses">;
  };
}

// Internal polling message interface
interface PollMessage {
  type: "refresh" | "no-op";
  data?: {
    refreshTypes: Array<"presenter-state" | "questions" | "activities" | "activity-responses">;
  };
}

export interface SSECallbacks {
  onPresenterStateRefresh?: () => void;
  onQuestionsRefresh?: () => void;
  onActivitiesRefresh?: () => void;
  onActivityResponsesRefresh?: () => void;
}

export interface UseEventSSEOptions {
  shortId?: string;
  callbacks?: SSECallbacks;
  enabled?: boolean;
  onActivity?: () => void; // Called on any polling activity (refresh or no-op)
}

export interface UseEventSSEReturn {
  isConnected: boolean;
  error: string | null;
  usingPolling: boolean;
}

export function useEventSSE({
  shortId,
  callbacks = {},
  enabled = true,
  onActivity,
}: UseEventSSEOptions): UseEventSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingPolling] = useState(true); // Always using polling now
  const abortControllerRef = useRef<AbortController | null>(null);
  const callbacksRef = useRef(callbacks);
  const isPollingRef = useRef(false);

  // Keep callbacks ref current
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!shortId || !enabled) {
      setIsConnected(false);
      return;
    }

    const startLongPolling = async () => {
      if (isPollingRef.current) {
        return; // Already polling
      }

      isPollingRef.current = true;
      setIsConnected(true);
      setError(null);

      while (isPollingRef.current && enabled) {
        try {
          // Create new abort controller for this poll
          abortControllerRef.current = new AbortController();
          
          const response = await fetch(`/api/events/${shortId}/poll`, {
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            throw new Error(`Poll request failed: ${response.status}`);
          }

          const message: PollMessage = await response.json() as PollMessage;

          // Call onActivity for any response (refresh or no-op)
          if (onActivity) {
            onActivity();
          }

          // Handle the poll response
          if (message.type === "refresh" && message.data?.refreshTypes) {
            const refreshTypes = message.data.refreshTypes;
            
            if (refreshTypes.includes("presenter-state") && callbacksRef.current.onPresenterStateRefresh) {
              callbacksRef.current.onPresenterStateRefresh();
            }
            if (refreshTypes.includes("questions") && callbacksRef.current.onQuestionsRefresh) {
              callbacksRef.current.onQuestionsRefresh();
            }
            if (refreshTypes.includes("activities") && callbacksRef.current.onActivitiesRefresh) {
              callbacksRef.current.onActivitiesRefresh();
            }
            if (refreshTypes.includes("activity-responses") && callbacksRef.current.onActivityResponsesRefresh) {
              callbacksRef.current.onActivityResponsesRefresh();
            }
          }
          // For "no-op", we just continue polling (but onActivity was already called)

        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            // Request was aborted, this is normal when cleaning up
            break;
          }
          
          console.error("Long polling error:", error);
          setError(error instanceof Error ? error.message : "Unknown polling error");
          
          // Wait before retrying on error
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      isPollingRef.current = false;
      setIsConnected(false);
    };

    void startLongPolling();

    return () => {
      isPollingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsConnected(false);
    };
  }, [shortId, enabled, onActivity]);

  return {
    isConnected,
    error,
    usingPolling,
  };
}