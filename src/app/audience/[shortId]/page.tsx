"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { api } from "~/trpc/react";
import { WelcomeActivity } from "~/components/features/activities/welcome-activity";
import { TimerActivity } from "~/components/features/activities/timer-activity";
import { MultipleChoiceActivity } from "~/components/features/activities/multiple-choice-activity";
import { FreeResponseActivity } from "~/components/features/activities/free-response-activity";
import { RankingActivity } from "~/components/features/activities/ranking-activity";
import { BreakActivity } from "~/components/features/activities/break-activity";
import { ThankYouActivity } from "~/components/features/activities/thank-you-activity";

interface SSEMessage {
  type: "connected" | "refresh";
}

export default function AudiencePage() {
  const params = useParams();
  const shortId = params.shortId as string;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingPolling, setUsingPolling] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Get event by shortId
  const { data: event } = api.event.getByShortId.useQuery(
    { shortId },
    { enabled: !!shortId },
  );

  // Get presenter state for this event
  const { data: presenterState, refetch: refetchPresenterState } =
    api.presenter.getByEventId.useQuery(
      { eventId: event?.id ?? 0 },
      { enabled: !!event?.id },
    );

  useEffect(() => {
    if (!shortId) return;

    const connectSSE = () => {
      try {
        console.log(
          `Establishing SSE connection to: /api/events/${shortId}/stream`,
        );
        const eventSource = new EventSource(`/api/events/${shortId}/stream`);
        eventSourceRef.current = eventSource;

        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        eventSource.onopen = () => {
          console.log("SSE connection opened successfully");
          setIsConnected(true);
          setError(null);
          reconnectAttempts = 0; // Reset on successful connection
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
                // Trigger a refresh of the presenter state
                void refetchPresenterState();
                break;
            }
          } catch {
            console.error("Error parsing SSE message");
          }
        };

        eventSource.onerror = (event) => {
          console.error("SSE error:", {
            readyState: eventSource.readyState,
            url: eventSource.url,
            event: event,
            timestamp: new Date().toISOString(),
          });
          setIsConnected(false);

          // Log readyState for debugging
          const stateNames = ["CONNECTING", "OPEN", "CLOSED"];
          const stateName = stateNames[eventSource.readyState] ?? "UNKNOWN";
          console.log(
            `EventSource readyState: ${eventSource.readyState} (${stateName})`,
          );

          // Close the connection
          eventSource.close();

          // Only attempt to reconnect if we haven't exceeded max attempts
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setError(
              `Connection lost (${stateName}). Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`,
            );

            // Use exponential backoff for reconnection
            const delay = Math.min(
              1000 * Math.pow(2, reconnectAttempts),
              10000,
            );
            console.log(`Reconnecting in ${delay}ms...`);
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
        void refetchPresenterState();
      };

      // Poll every 3 seconds
      pollingRef.current = setInterval(poll, 3000);
      poll(); // Initial poll
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
  }, [shortId, refetchPresenterState]);

  const renderCurrentPage = () => {
    if (!presenterState) {
      return (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          Waiting for presenter to start...
        </div>
      );
    }

    if (!presenterState.data) {
      return (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No activity data available
        </div>
      );
    }

    switch (presenterState.data.type) {
      case "welcome":
        return <WelcomeActivity data={presenterState.data} />;
      case "timer":
        return <TimerActivity data={presenterState.data} />;
      case "multiple-choice":
        return <MultipleChoiceActivity data={presenterState.data} />;
      case "free-response":
        return <FreeResponseActivity data={presenterState.data} />;
      case "ranking":
        return <RankingActivity data={presenterState.data} />;
      case "break":
        return <BreakActivity data={presenterState.data} />;
      case "thank-you":
        return <ThankYouActivity data={presenterState.data} />;
      default: {
        const unknownData = presenterState.data as { type: string };
        return (
          <div className="py-8">
            <Card>
              <CardContent className="pt-6">
                <h2 className="mb-4 text-xl font-semibold">
                  Unknown Activity: {unknownData.type}
                </h2>
                <pre className="overflow-auto rounded-lg bg-gray-100 p-4 text-sm dark:bg-gray-800">
                  {JSON.stringify(presenterState.data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        );
      }
    }
  };

  if (error && !isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold break-words sm:text-2xl lg:text-3xl">
            {event?.title ?? `Event: ${shortId.toUpperCase()}`}
          </h1>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className="shrink-0"
            >
              {isConnected
                ? usingPolling
                  ? "Connected (Polling)"
                  : "Connected"
                : "Connecting..."}
            </Badge>
            <ThemeToggle />
          </div>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            {renderCurrentPage()}
          </CardContent>
        </Card>

        {error && isConnected && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
            <p className="text-sm break-words text-yellow-800 dark:text-yellow-300">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
