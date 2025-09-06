import { useEffect, useRef, useState } from "react";

export interface PollMessage {
  type: "refresh" | "no-op";
  data?: {
    refreshTypes: Array<"presenter-state" | "questions" | "activities" | "activity-responses">;
  };
}

export interface PollingCallbacks {
  onPresenterStateRefresh?: () => void;
  onQuestionsRefresh?: () => void;
  onActivitiesRefresh?: () => void;
  onActivityResponsesRefresh?: () => void;
}

export interface UseEventPollingOptions {
  shortId?: string;
  callbacks?: PollingCallbacks;
  enabled?: boolean;
}

export interface UseEventPollingReturn {
  isConnected: boolean;
  error: string | null;
}

export function useEventPolling({
  shortId,
  callbacks = {},
  enabled = true,
}: UseEventPollingOptions): UseEventPollingReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    const startPolling = async () => {
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
          // For "no-op", we just continue polling

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

    void startPolling();

    return () => {
      isPollingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsConnected(false);
    };
  }, [shortId, enabled]);

  return {
    isConnected,
    error,
  };
}