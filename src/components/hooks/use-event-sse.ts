import { useEffect, useRef, useState } from "react";

export interface SSEMessage {
  type: "connected" | "refresh";
  data?: {
    refreshTypes: Array<"presenter-state" | "questions" | "activities">;
  };
}

export interface SSECallbacks {
  onPresenterStateRefresh?: () => void;
  onQuestionsRefresh?: () => void;
  onActivitiesRefresh?: () => void;
}

export interface UseEventSSEOptions {
  shortId?: string;
  callbacks?: SSECallbacks;
  enabled?: boolean;
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
}: UseEventSSEOptions): UseEventSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingPolling, setUsingPolling] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef(callbacks);

  // Keep callbacks ref current
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!shortId || !enabled) {
      return;
    }

    const connectSSE = () => {
      try {
        const eventSource = new EventSource(`/api/events/${shortId}/stream`);
        eventSourceRef.current = eventSource;

        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          reconnectAttempts = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const message: SSEMessage = JSON.parse(
              event.data as string,
            ) as SSEMessage;

            switch (message.type) {
              case "connected":
                setIsConnected(true);
                setError(null);
                break;
              case "refresh":
                const refreshTypes = message.data?.refreshTypes ?? ["presenter-state"];
                
                if (refreshTypes.includes("presenter-state") && callbacksRef.current.onPresenterStateRefresh) {
                  callbacksRef.current.onPresenterStateRefresh();
                }
                if (refreshTypes.includes("questions") && callbacksRef.current.onQuestionsRefresh) {
                  callbacksRef.current.onQuestionsRefresh();
                }
                if (refreshTypes.includes("activities") && callbacksRef.current.onActivitiesRefresh) {
                  callbacksRef.current.onActivitiesRefresh();
                }
                break;
            }
          } catch (error) {
            console.error("Error parsing SSE message:", error);
          }
        };

        eventSource.onerror = (_event) => {
          setIsConnected(false);
          eventSource.close();

          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setError(
              `Connection lost. Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`,
            );

            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts),
              10000,
            );
            setTimeout(() => {
              connectSSE();
            }, delay);
          } else {
            setError(
              "SSE connection failed after 5 attempts. Switching to polling mode.",
            );
            startPolling();
          }
        };
      } catch (err) {
        console.error("Failed to establish SSE connection:", err);
        setError("Unable to connect to event stream");
        setIsConnected(false);
      }
    };

    const startPolling = () => {
      setUsingPolling(true);
      setIsConnected(true);
      setError("Using polling mode (slower updates)");

      const poll = () => {
        if (callbacksRef.current.onPresenterStateRefresh) {
          callbacksRef.current.onPresenterStateRefresh();
        }
      };

      pollingRef.current = setInterval(poll, 3000);
      poll();
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setUsingPolling(false);
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      stopPolling();
    };
  }, [shortId, enabled]); // Removed callbacks from deps to prevent unnecessary re-connections

  return {
    isConnected,
    error,
    usingPolling,
  };
}