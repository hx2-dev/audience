import {
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  REALTIME_SUBSCRIBE_STATES,
} from "@supabase/supabase-js";
import { useEffect, useState, useRef } from "react";
import z from "zod";
import { createSupabaseClientClient } from "~/core/adapters/auth/supabase-client";
import { useAuth } from "~/components/providers/supabase-auth-provider";
import type { PresenterState } from "~/core/features/presenter/types";
import {
  activityDataValidator,
  presenterStateRowValidator,
  type PresenterStateRow,
} from "~/core/features/presenter/types";

function validatePresenterStateRow(data: unknown): PresenterStateRow {
  const result = presenterStateRowValidator.safeParse(data);
  if (!result.success) {
    console.error(
      "Invalid presenter state row data:",
      z.treeifyError(result.error),
      data,
    );
    throw new Error(
      `Invalid presenter state row data: ${result.error.message}`,
    );
  }
  return result.data;
}

export interface UsePresenterStateRealtimeOptions {
  eventId?: string;
  enabled?: boolean;
}

export interface UsePresenterStateRealtimeReturn {
  presenterState: PresenterState | null;
  isConnected: boolean;
  error: string | null;
}

function transformPresenterStateRow(state: PresenterStateRow): PresenterState {
  let parsedData: PresenterState["data"];

  if (state.data) {
    try {
      const rawData: unknown =
        typeof state.data === "string" ? JSON.parse(state.data) : state.data;

      // Transform date strings back to Date objects for timer activities
      if (
        rawData &&
        typeof rawData === "object" &&
        "type" in rawData &&
        rawData.type === "timer" &&
        "startedAt" in rawData &&
        typeof rawData.startedAt === "string"
      ) {
        (rawData as { startedAt: Date }).startedAt = new Date(
          rawData.startedAt,
        );
      }

      // Validate and parse using Zod
      const validationResult = activityDataValidator.safeParse(rawData);
      parsedData = validationResult.success ? validationResult.data : undefined;
    } catch {
      parsedData = undefined;
    }
  } else {
    parsedData = undefined;
  }

  return {
    eventId: state.eventId,
    currentPage: state.currentPage,
    data: parsedData,
  };
}

export function usePresenterStateRealtime({
  eventId,
  enabled = true,
}: UsePresenterStateRealtimeOptions): UsePresenterStateRealtimeReturn {
  const [presenterState, setPresenterState] = useState<PresenterState | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const isTabVisible = useRef<boolean>(true);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (!eventId || !enabled) {
      setIsConnected(false);
      return;
    }

    // Wait for auth to be ready before connecting to realtime
    if (authLoading) {
      return;
    }

    const supabase = createSupabaseClientClient();
    let currentVisibilityTimeout: NodeJS.Timeout | null = null;
    let currentPeriodicRefresh: NodeJS.Timeout | null = null;

    const fetchData = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("hx2-audience_presenter_state")
          .select("*")
          .eq("eventId", eventId)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError;
        }

        setPresenterState(data ? transformPresenterStateRow(data) : null);
        setError(null);
        lastUpdateRef.current = Date.now();
      } catch (err) {
        console.error("Error fetching presenter state:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch presenter state",
        );
      }
    };

    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel(`presenter-state-${eventId}`)
        .on(
          "postgres_changes",
          {
            event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL,
            schema: "public",
            table: "hx2-audience_presenter_state",
            filter: `eventId=eq.${eventId}`,
          },
          (payload) => {
            lastUpdateRef.current = Date.now();
            // Restart the backup refresh timer since we got a realtime update
            restartPeriodicRefresh();

            switch (payload.eventType) {
              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT:
              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE: {
                const validatedRow = validatePresenterStateRow(payload.new);
                setPresenterState(transformPresenterStateRow(validatedRow));
                break;
              }
              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE: {
                setPresenterState(null);
                break;
              }
            }
          },
        )
        .subscribe((status: REALTIME_SUBSCRIBE_STATES) => {
          switch (status) {
            case REALTIME_SUBSCRIBE_STATES.SUBSCRIBED:
              setIsConnected(true);
              setError(null);
              break;
            case REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR:
            case REALTIME_SUBSCRIBE_STATES.TIMED_OUT:
              setIsConnected(false);
              setError("Real-time connection failed");
              break;
            case REALTIME_SUBSCRIBE_STATES.CLOSED:
              setIsConnected(false);
              break;
          }
        });

      return channel;
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isTabVisible.current = false;
        // Clear any existing timeout
        if (currentVisibilityTimeout) {
          clearTimeout(currentVisibilityTimeout);
          currentVisibilityTimeout = null;
        }
      } else {
        isTabVisible.current = true;
        // Refresh data when tab becomes visible after being hidden
        void fetchData();
      }
    };

    // Periodic refresh when no updates received
    const restartPeriodicRefresh = () => {
      // Clear existing interval
      if (currentPeriodicRefresh) {
        clearInterval(currentPeriodicRefresh);
      }

      const checkAndRefresh = () => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateRef.current;

        // If no updates for 1 minute, refresh
        if (timeSinceLastUpdate > 60000) {
          void fetchData();
        }
      };

      // Check every 60 seconds
      currentPeriodicRefresh = setInterval(checkAndRefresh, 60000);
    };

    void fetchData();
    const channel = setupRealtimeSubscription();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    restartPeriodicRefresh();

    return () => {
      void supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (currentVisibilityTimeout) {
        clearTimeout(currentVisibilityTimeout);
      }
      if (currentPeriodicRefresh) {
        clearInterval(currentPeriodicRefresh);
      }

      setIsConnected(false);
    };
  }, [eventId, enabled, authLoading]);

  return {
    presenterState,
    isConnected,
    error,
  };
}
