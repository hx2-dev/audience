import {
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  REALTIME_SUBSCRIBE_STATES,
} from "@supabase/supabase-js";
import { useEffect, useState, useRef } from "react";
import z from "zod";
import { createSupabaseClientClient } from "~/core/adapters/auth/supabase-client";
import type { Question } from "~/core/features/questions/types";
import {
  questionRowValidator,
  type QuestionRow,
} from "~/core/features/questions/types";

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

function validateQuestionRow(data: unknown): QuestionRow {
  const result = questionRowValidator.safeParse(data);
  if (!result.success) {
    console.error(
      "Invalid question row data:",
      z.treeifyError(result.error),
      data,
    );
    throw new Error(`Invalid question row data: ${result.error.message}`);
  }
  return result.data;
}

export interface UseQuestionsRealtimeOptions {
  eventId?: string;
  enabled?: boolean;
}

export interface UseQuestionsRealtimeReturn {
  questions: Question[];
  isConnected: boolean;
  error: string | null;
}

export function useQuestionsRealtime({
  eventId,
  enabled = true,
}: UseQuestionsRealtimeOptions): UseQuestionsRealtimeReturn {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const isTabVisible = useRef<boolean>(true);

  useEffect(() => {
    // @ts-expect-error: TS7015 -- creating a new global
    // eslint-disable-next-line @typescript-eslint/dot-notation -- Creating a new global
    window["questions"] = {
      getQuestions: () => {
        return questions;
      },
      getIsConnected: () => {
        return isConnected;
      },
      getError: () => {
        return error;
      },
    };
  }, [questions, isConnected, error]);

  useEffect(() => {
    if (!eventId || !enabled) {
      setIsConnected(false);
      return;
    }

    const supabase = createSupabaseClientClient();
    let currentVisibilityTimeout: NodeJS.Timeout | null = null;
    let currentPeriodicRefresh: NodeJS.Timeout | null = null;

    const fetchData = async () => {
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
        setQuestions(validatedQuestions.map(transformQuestionRow));
        setError(null);
        lastUpdateRef.current = Date.now();
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch questions",
        );
      }
    };

    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel(`questions-${eventId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "hx2-audience_question",
            filter: `eventId=eq.${eventId}`,
          },
          (payload) => {
            lastUpdateRef.current = Date.now();
            // Restart the backup refresh timer since we got a realtime update
            restartPeriodicRefresh();
            switch (payload.eventType) {
              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE: {
                const validatedRow = validateQuestionRow(payload.old);
                setQuestions((prev) =>
                  prev.filter((q) => q.id !== validatedRow.id),
                );
                break;
              }

              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE: {
                const validatedRow = validateQuestionRow(payload.new);
                const updatedQuestion = transformQuestionRow(validatedRow);
                setQuestions((prev) =>
                  prev
                    .map((q) =>
                      q.id === updatedQuestion.id ? updatedQuestion : q,
                    )
                    .filter((q) => !q.deleted),
                );
                break;
              }

              case REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT: {
                const validatedRow = validateQuestionRow(payload.new);
                const newQuestion = transformQuestionRow(validatedRow);
                if (!newQuestion.deleted) {
                  setQuestions((prev) => [...prev, newQuestion]);
                }
                break;
              }
            }
          },
        )
        .subscribe((status: REALTIME_SUBSCRIBE_STATES) => {
          console.log("questions realtime status", status);
          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            setIsConnected(true);
            setError(null);
          } else if (
            status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
            status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
          ) {
            setIsConnected(false);
            setError("Real-time connection failed");
          } else if (status === REALTIME_SUBSCRIBE_STATES.CLOSED) {
            setIsConnected(false);
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
  }, [eventId, enabled]);

  return {
    questions,
    isConnected,
    error,
  };
}
