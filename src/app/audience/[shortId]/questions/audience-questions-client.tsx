"use client";

import { QuestionsTab } from "~/components/features/audience/questions-tab";
import { AudienceTabsNavigation } from "~/components/features/audience/audience-tabs-navigation";
import { api } from "~/trpc/react";
import { useSSE } from "~/components/providers/sse-provider";
import { useEvent } from "~/components/providers/event-provider";
import { useEffect } from "react";

export function AudienceQuestionsPageClient() {
  // Get event data from context
  const { event, shortId } = useEvent();

  // Get SSE connection from context
  const { 
    onQuestionsRefresh
  } = useSSE();

  // Fetch questions for this event
  const questionsQuery = api.questions.getByEventId.useQuery(
    { eventId: event?.id ?? 0 },
    { enabled: !!event?.id },
  );

  // Enhanced refetch function that also dispatches events for navigation
  const enhancedQuestionsRefresh = () => {
    void questionsQuery.refetch();
    // Also dispatch event for navigation to pick up
    window.dispatchEvent(
      new CustomEvent("questions-updated", {
        detail: { questionsCount: questionsQuery.data?.length ?? 0 },
      }),
    );
  };

  // Register callback with SSE context
  useEffect(() => {
    const unregisterQuestions = onQuestionsRefresh(enhancedQuestionsRefresh);

    return () => {
      unregisterQuestions();
    };
  }, [onQuestionsRefresh, enhancedQuestionsRefresh]);

  // Extract data for easier access
  const questions = questionsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AudienceTabsNavigation
        shortId={shortId}
        currentPage="questions"
        questionsCount={questions.length}
      />

      {/* Questions Content */}
      <QuestionsTab
        eventId={event?.id ?? ""}
        questions={questions}
        refetchQuestions={questionsQuery.refetch}
      />
    </div>
  );
}
