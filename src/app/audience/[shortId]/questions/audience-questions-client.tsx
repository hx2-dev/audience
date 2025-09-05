"use client";

import React from "react";
import { QuestionsTab } from "~/components/features/audience/questions-tab";
import { AudienceTabsNavigation } from "~/components/features/audience/audience-tabs-navigation";
import { api } from "~/trpc/react";
import { useQuestionsSSE } from "~/components/hooks/use-sse-query";
import { useEvent } from "~/components/providers/event-provider";
import { useSession } from "next-auth/react";

export function AudienceQuestionsPageClient() {
  // Get event data from context
  const { event, shortId } = useEvent();
  const { data: session } = useSession();

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

  // SSE connection with automatic query integration
  const {} = useQuestionsSSE(
    { refetch: enhancedQuestionsRefresh },
    shortId,
    true,
  );

  // Extract data for easier access
  const questions = questionsQuery.data ?? [];


  return (
    <div>
      <div className="mx-auto max-w-2xl space-y-6">

        <AudienceTabsNavigation
          shortId={shortId}
          currentPage="questions"
          questionsCount={questions.length}
        />

        {/* Questions Content */}
        <QuestionsTab
          eventId={event?.id ?? ""}
          session={session!}
          questions={questions}
          refetchQuestions={questionsQuery.refetch}
        />
      </div>
    </div>
  );
}
