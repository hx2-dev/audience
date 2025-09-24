"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { createSupabaseClientClient } from "~/adapters/auth/supabase-client";
import type { PresenterState } from "~/core/features/presenter/types";
import type { Question } from "~/core/features/questions/types";
import {
  activityDataValidator,
  presenterStateRowValidator,
  type PresenterStateRow,
} from "~/core/features/presenter/types";
import {
  questionRowValidator,
  type QuestionRow,
} from "~/core/features/questions/types";
import { useAuth } from "./supabase-auth-provider";
import {
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  REALTIME_SUBSCRIBE_STATES,
} from "@supabase/supabase-js";

function validatePresenterStateRow(data: unknown): PresenterStateRow {
  const result = presenterStateRowValidator.safeParse(data);
  if (!result.success) {
    console.error(
      "Invalid presenter state row data:",
      result.error.errors,
      data,
    );
    throw new Error(
      `Invalid presenter state row data: ${result.error.message}`,
    );
  }
  return result.data;
}

function validateQuestionRow(data: unknown): QuestionRow {
  const result = questionRowValidator.safeParse(data);
  if (!result.success) {
    console.error("Invalid question row data:", result.error.errors, data);
    throw new Error(`Invalid question row data: ${result.error.message}`);
  }
  return result.data;
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

function transformQuestionRow(row: QuestionRow): Question {
  return {
    id: row.id,
    eventId: row.eventId,
    question: row.question,
    submitterName: row.submitterName,
    submitterUserId: row.submitterUserId,
    isAnonymous: row.isAnonymous,
    isAnswered: row.isAnswered,
    answer: row.answer,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    updatedBy: row.updatedBy,
    deleted: row.deleted ? new Date(row.deleted) : null,
  };
}

interface AudienceRealtimeContextValue {
  presenterState: PresenterState | null;
  questions: Question[];
  isConnected: boolean;
  error: string | null;
  // Callback registration for components that need to know about updates
  onPresenterStateUpdate: (
    callback: (state: PresenterState | null) => void,
  ) => () => void;
  onQuestionsUpdate: (callback: (questions: Question[]) => void) => () => void;
}

const AudienceRealtimeContext =
  createContext<AudienceRealtimeContextValue | null>(null);

export const useAudienceRealtime = () => {
  const context = useContext(AudienceRealtimeContext);
  if (!context) {
    throw new Error(
      "useAudienceRealtime must be used within an AudienceRealtimeProvider",
    );
  }
  return context;
};

interface AudienceRealtimeProviderProps {
  eventId: string;
  children: React.ReactNode;
}

export function AudienceRealtimeProvider({
  eventId,
  children,
}: AudienceRealtimeProviderProps) {
  const [presenterState, setPresenterState] = useState<PresenterState | null>(
    null,
  );
  const { loading: authLoading } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastPresenterUpdateRef = useRef<number>(Date.now());
  const lastQuestionsUpdateRef = useRef<number>(Date.now());
  const periodicRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const presenterCallbacks = useRef(
    new Set<(state: PresenterState | null) => void>(),
  );
  const questionsCallbacks = useRef(new Set<(questions: Question[]) => void>());

  const supabase = createSupabaseClientClient();

  const fetchPresenterState = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("hx2-audience_presenter_state")
        .select("*")
        .eq("eventId", eventId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      const newState = data ? transformPresenterStateRow(data) : null;
      setPresenterState(newState);
      lastPresenterUpdateRef.current = Date.now();

      // Notify callbacks
      presenterCallbacks.current.forEach((callback) => callback(newState));

      setError(null);
    } catch (err) {
      console.error("Error fetching presenter state:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch presenter state",
      );
    }
  }, [eventId, supabase]);

  const fetchQuestions = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("hx2-audience_question")
        .select("*")
        .eq("eventId", eventId)
        .is("deleted", null)
        .order("createdAt", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const validatedQuestions = (data ?? []).map(validateQuestionRow);
      const newQuestions = validatedQuestions.map(transformQuestionRow);
      setQuestions(newQuestions);
      lastQuestionsUpdateRef.current = Date.now();

      // Notify callbacks
      questionsCallbacks.current.forEach((callback) => callback(newQuestions));

      setError(null);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch questions",
      );
    }
  }, [eventId, supabase]);

  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchPresenterState(), fetchQuestions()]);
  }, [fetchPresenterState, fetchQuestions]);

  useEffect(() => {
    if (!eventId) {
      setIsConnected(false);
      return;
    }

    // Wait for auth to be ready before connecting to realtime
    if (authLoading) {
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel(`audience-event-${eventId}`)
        .on(
          "postgres_changes",
          {
            event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL,
            schema: "public",
            table: "hx2-audience_presenter_state",
            filter: `eventId=eq.${eventId}`,
          },
          (payload) => {
            lastPresenterUpdateRef.current = Date.now();
            // Restart the backup refresh timer since we got a realtime update
            restartPeriodicRefresh();

            switch (payload.eventType) {
              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT:
              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE: {
                const validatedRow = validatePresenterStateRow(payload.new);
                const newState = transformPresenterStateRow(validatedRow);
                setPresenterState(newState);
                presenterCallbacks.current.forEach((callback) =>
                  callback(newState),
                );
              }
              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE: {
                setPresenterState(null);
                presenterCallbacks.current.forEach((callback) =>
                  callback(null),
                );
              }
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL,
            schema: "public",
            table: "hx2-audience_question",
            filter: `eventId=eq.${eventId}`,
          },
          (payload) => {
            lastQuestionsUpdateRef.current = Date.now();
            // Restart the backup refresh timer since we got a realtime update
            restartPeriodicRefresh();

            switch (payload.eventType) {
              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT: {
                const validatedRow = validateQuestionRow(payload.new);
                const newQuestion = transformQuestionRow(validatedRow);
                if (!newQuestion.deleted) {
                  setQuestions((prev) => {
                    const updated = [...prev, newQuestion];
                    questionsCallbacks.current.forEach((callback) =>
                      callback(updated),
                    );
                    return updated;
                  });
                }
                break;
              }

              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE: {
                const validatedRow = validateQuestionRow(payload.new);
                const updatedQuestion = transformQuestionRow(validatedRow);
                setQuestions((prev) => {
                  const updated = prev
                    .map((q) =>
                      q.id === updatedQuestion.id ? updatedQuestion : q,
                    )
                    .filter((q) => !q.deleted);
                  questionsCallbacks.current.forEach((callback) =>
                    callback(updated),
                  );
                  return updated;
                });
                break;
              }

              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE: {
                const validatedRow = validateQuestionRow(payload.old);
                setQuestions((prev) => {
                  const updated = prev.filter((q) => q.id !== validatedRow.id);
                  questionsCallbacks.current.forEach((callback) =>
                    callback(updated),
                  );
                  return updated;
                });
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
      if (!document.hidden) {
        // Refresh all data when tab becomes visible after being hidden
        void fetchAllData();
      }
    };

    // Periodic refresh when no updates received
    const restartPeriodicRefresh = () => {
      // Clear existing interval
      if (periodicRefreshRef.current) {
        clearInterval(periodicRefreshRef.current);
      }

      const checkAndRefresh = () => {
        const now = Date.now();
        const presenterStale = now - lastPresenterUpdateRef.current > 60000;
        const questionsStale = now - lastQuestionsUpdateRef.current > 60000;

        if (presenterStale) {
          void fetchPresenterState();
        }
        if (questionsStale) {
          void fetchQuestions();
        }
      };

      // Check every 60 seconds
      periodicRefreshRef.current = setInterval(checkAndRefresh, 60000);
    };

    // Initialize
    void fetchAllData();
    channel = setupRealtimeSubscription();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    restartPeriodicRefresh();

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (periodicRefreshRef.current) {
        clearInterval(periodicRefreshRef.current);
      }
      setIsConnected(false);
    };
  }, [
    eventId,
    supabase,
    fetchAllData,
    fetchPresenterState,
    fetchQuestions,
    authLoading,
  ]);

  // Callback registration methods
  const onPresenterStateUpdate = useCallback(
    (callback: (state: PresenterState | null) => void) => {
      presenterCallbacks.current.add(callback);
      return () => presenterCallbacks.current.delete(callback);
    },
    [],
  );

  const onQuestionsUpdate = useCallback(
    (callback: (questions: Question[]) => void) => {
      questionsCallbacks.current.add(callback);
      return () => questionsCallbacks.current.delete(callback);
    },
    [],
  );

  const contextValue: AudienceRealtimeContextValue = {
    presenterState,
    questions,
    isConnected,
    error,
    onPresenterStateUpdate,
    onQuestionsUpdate,
  };

  return (
    <AudienceRealtimeContext.Provider value={contextValue}>
      {children}
    </AudienceRealtimeContext.Provider>
  );
}
