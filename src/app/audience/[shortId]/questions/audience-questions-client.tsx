"use client";

import { QuestionsTab } from "~/components/features/audience/questions-tab";
import { AudienceTabsNavigation } from "~/components/features/audience/audience-tabs-navigation";
import { useAudienceRealtime } from "~/components/providers/audience-realtime-provider";
import { useEvent } from "~/components/providers/event-provider";
import { useEffect } from "react";

export function AudienceQuestionsPageClient() {
  // Get event data from context
  const { event, shortId } = useEvent();

  // Get questions from unified realtime provider
  const { questions, refetchQuestions } = useAudienceRealtime();

  // Dispatch custom event for navigation count updates
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("questions-updated", {
        detail: { questionsCount: questions.length },
      }),
    );
  }, [questions.length]);

  return (
    <div>
      <div className="space-y-6">
        <AudienceTabsNavigation
          shortId={shortId}
          currentPage="questions"
          questionsCount={questions.length}
        />

        {/* Questions Content */}
        <QuestionsTab
          eventId={event?.id ?? ""}
          questions={questions}
          refetchQuestions={refetchQuestions}
        />
      </div>
    </div>
  );
}
