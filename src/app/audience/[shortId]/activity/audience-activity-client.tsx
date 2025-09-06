"use client";

import { ActivityTab } from "~/components/features/audience/activity-tab";
import { AudienceTabsNavigation } from "~/components/features/audience/audience-tabs-navigation";
import { api } from "~/trpc/react";
import { useSSE } from "~/components/providers/sse-provider";
import { useEvent } from "~/components/providers/event-provider";
import { useEffect } from "react";

export function AudienceActivityPageClient() {
  // Get event data from context
  const { event, shortId } = useEvent();

  // Get SSE connection from context
  const { 
    onPresenterStateRefresh,
    onQuestionsRefresh,
    onActivityResponsesRefresh
  } = useSSE();

  // Get presenter state with user response data in one query
  const combinedDataQuery = api.presenter.getStateWithUserResponse.useQuery(
    {
      eventId: event?.id ?? 0,
    },
    { enabled: !!event?.id },
  );

  // Fetch questions count for navigation
  const questionsQuery = api.questions.getByEventId.useQuery(
    { eventId: event?.id ?? 0 },
    { enabled: !!event?.id },
  );

  // Enhanced refetch functions for custom event dispatching
  const enhancedCombinedRefresh = () => {
    void combinedDataQuery.refetch();
    // Also dispatch event for any additional listeners
    window.dispatchEvent(new CustomEvent("activity-responses-updated"));
  };

  const enhancedQuestionsRefresh = () => {
    // Refetch questions count for navigation
    void questionsQuery.refetch();
    // Dispatch event for navigation to pick up
    window.dispatchEvent(
      new CustomEvent("questions-updated", {
        detail: { questionsCount: questionsQuery.data?.length ?? 0 },
      }),
    );
  };

  // Register callbacks with SSE context
  useEffect(() => {
    const unregisterPresenterState = onPresenterStateRefresh(enhancedCombinedRefresh);
    const unregisterQuestions = onQuestionsRefresh(enhancedQuestionsRefresh);
    const unregisterActivityResponses = onActivityResponsesRefresh(enhancedCombinedRefresh);

    return () => {
      unregisterPresenterState();
      unregisterQuestions();
      unregisterActivityResponses();
    };
  }, [onPresenterStateRefresh, onQuestionsRefresh, onActivityResponsesRefresh, enhancedCombinedRefresh, enhancedQuestionsRefresh]);

  // Extract data for easier access
  const combinedData = combinedDataQuery.data;
  const presenterState = combinedData?.presenterState;
  const questions = questionsQuery.data ?? [];


  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AudienceTabsNavigation
        shortId={shortId}
        currentPage="activity"
        questionsCount={questions.length}
      />

      {/* Activity Content */}
      {presenterState ? (
        <ActivityTab
          presenterState={presenterState}
          userResponse={combinedData?.userResponse ?? null}
          allResponses={combinedData?.allResponses ?? []}
          refetchData={combinedDataQuery.refetch}
        />
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Waiting for presenter to start an activity...
          </p>
        </div>
      )}
    </div>
  );
}
