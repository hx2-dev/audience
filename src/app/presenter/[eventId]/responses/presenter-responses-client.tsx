"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ActivityResponseCard } from "~/components/features/presenter/activity-responses/activity-response-card";
import { api } from "~/trpc/react";
import { useMultiSSEQuery } from "~/components/hooks/use-sse-query";
import type { Activity } from "~/core/features/activities/types";
import { PresenterTabsNavigation } from "~/components/features/presenter/presenter-tabs-navigation";
import { usePresenterEvent } from "~/components/providers/presenter-event-provider";

export function PresenterResponsesPageClient() {
  // Get event data from context
  const { event, eventId } = usePresenterEvent();

  // Fetch activities for this event
  const activitiesQuery = api.activities.getByEventId.useQuery(
    { eventId },
    { enabled: !!eventId },
  );

  // Enhanced refetch functions for custom event dispatching
  const enhancedQuestionsRefresh = () => {
    // Dispatch event for navigation to pick up
    window.dispatchEvent(new CustomEvent("questions-updated"));
  };

  const enhancedActivityResponsesRefresh = () => {
    // Dispatch event for individual activity components to pick up
    window.dispatchEvent(new CustomEvent("activity-responses-updated"));
  };

  // SSE connection with automatic query integration
  const {} = useMultiSSEQuery(
    [
      {
        queryResult: { refetch: enhancedQuestionsRefresh },
        eventType: "questions",
      },
      { queryResult: activitiesQuery, eventType: "activities" },
      {
        queryResult: { refetch: enhancedActivityResponsesRefresh },
        eventType: "activity-responses",
      },
    ],
    event?.shortId,
    !!event?.shortId,
  );

  // Extract data for easier access
  const activities = activitiesQuery.data ?? [];

  // Mutations
  const updatePresenterStateMutation = api.presenter.updateState.useMutation();

  const handleShowResults = async (activity: Activity) => {
    await updatePresenterStateMutation.mutateAsync({
      eventId,
      currentPage: "results",
      data: {
        type: "results",
        activityId: activity.id,
        title: `${activity.name} - Results`,
      },
    });
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl">
        <PresenterTabsNavigation eventId={eventId} currentPage="responses" />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audience Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activities.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No activities created yet.
                    <br />
                    Create activities in the &ldquo;Manage Activities&rdquo; tab
                    to see responses here.
                  </div>
                ) : (
                  activities.map((activity) => (
                    <ActivityResponseCard
                      key={activity.id}
                      activity={activity}
                      onShowResults={handleShowResults}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
