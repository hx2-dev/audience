"use client";

import { ActivityTab } from "~/components/features/audience/activity-tab";
import { AudienceTabsNavigation } from "~/components/features/audience/audience-tabs-navigation";
import { api } from "~/trpc/react";
import { useMultiSSEQuery } from "~/components/hooks/use-sse-query";
import { useEvent } from "~/components/providers/event-provider";

export function AudienceActivityPageClient() {
  // Get event data from context
  const { event, shortId } = useEvent();

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

  // SSE connection with automatic query integration
  const {} = useMultiSSEQuery(
    [
      {
        queryResult: { refetch: enhancedCombinedRefresh },
        eventType: "presenter-state",
      },
      {
        queryResult: { refetch: enhancedQuestionsRefresh },
        eventType: "questions",
      },
      {
        queryResult: { refetch: enhancedCombinedRefresh },
        eventType: "activity-responses",
      },
    ],
    shortId,
    true,
  );

  // Extract data for easier access
  const combinedData = combinedDataQuery.data;
  const presenterState = combinedData?.presenterState;
  const questions = questionsQuery.data ?? [];


  return (
    <div>
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
    </div>
  );
}
