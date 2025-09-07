"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PresenterControlSplit } from "~/components/features/presenter/presenter-control-split";
import { api } from "~/trpc/react";
import { useQuestionsRealtime } from "~/components/hooks/use-questions-realtime";
import type { ActivityData } from "~/core/features/presenter/types";
import { PresenterTabsNavigation } from "~/components/features/presenter/presenter-tabs-navigation";
import { usePresenterEvent } from "~/components/providers/presenter-event-provider";
import { useEffect } from "react";

export function PresenterControlPageClient() {
  // Get event data from context
  const { event, eventId } = usePresenterEvent();

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

  // Dispatch custom event for navigation count updates
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("questions-updated"));
  }, [questions.length]);

  // Mutations
  const createActivityMutation = api.activities.create.useMutation();
  const updatePresenterStateMutation = api.presenter.updateState.useMutation();

  const handleStateUpdate = async (page: string, data?: ActivityData) => {
    let updatedData = data;

    // First, create a saved activity if this is an interactive activity
    if (
      data &&
      ["multiple-choice", "free-response", "ranking"].includes(data.type)
    ) {
      const getActivityName = (activityData: ActivityData): string => {
        if (activityData.type === "multiple-choice") {
          return `Multiple Choice: ${activityData.question}`;
        }
        if (activityData.type === "free-response") {
          return `Free Response: ${activityData.question}`;
        }
        if (activityData.type === "ranking") {
          return `Ranking: ${activityData.question}`;
        }
        return `${activityData.type} Activity`;
      };

      const activityName = getActivityName(data);

      const createdActivity = await createActivityMutation.mutateAsync({
        eventId,
        name: activityName.substring(0, 100), // Truncate if too long
        type: data.type,
        data,
      });

      // Add the activityId to the data
      updatedData = { ...data, activityId: createdActivity.id } as ActivityData;

      await activitiesQuery.refetch();
    }

    // Then update the presenter state with the updated data (including activityId)
    await updatePresenterStateMutation.mutateAsync({
      eventId,
      currentPage: page,
      data: updatedData,
    });
  };


  return (
    <div>
      <div>

        <PresenterTabsNavigation eventId={eventId} currentPage="control" />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Presentation Control</CardTitle>
            </CardHeader>
            <CardContent>
              <PresenterControlSplit
                eventShortId={event.shortId ?? ""}
                onStateUpdate={handleStateUpdate}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
