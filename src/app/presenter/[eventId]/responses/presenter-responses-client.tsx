"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ActivityResponseCard } from "~/components/features/presenter/activity-responses/activity-response-card";
import { api } from "~/trpc/react";
import { useQuestionsRealtime } from "~/components/hooks/use-questions-realtime";
import type { Activity } from "~/core/features/activities/types";
import { PresenterTabsNavigation } from "~/components/features/presenter/presenter-tabs-navigation";
import { usePresenterEvent } from "~/components/providers/presenter-event-provider";
import { useEffect } from "react";

export function PresenterResponsesPageClient() {
  // Get event data from context
  const { eventId } = usePresenterEvent();

  // Fetch activities for this event
  const activitiesQuery = api.activities.getByEventId.useQuery(
    { eventId },
    { enabled: !!eventId },
  );

  // Real-time questions subscription for navigation updates
  const { questions } = useQuestionsRealtime({
    eventId,
    enabled: !!eventId,
  });

  // Dispatch custom events for navigation and activity responses
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("questions-updated"));
  }, [questions.length]);

  useEffect(() => {
    // Dispatch event for individual activity components to pick up
    window.dispatchEvent(new CustomEvent("activity-responses-updated"));
  }, [activitiesQuery.data]);

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
      <div>
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
