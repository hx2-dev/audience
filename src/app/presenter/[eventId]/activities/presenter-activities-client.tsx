"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ActivityManagerSplit } from "~/components/features/presenter/activity-manager-split";
import { api } from "~/trpc/react";
import { useQuestionsRealtime } from "~/components/hooks/use-questions-realtime";
import type {
  Activity,
  CreateActivity,
} from "~/core/features/activities/types";
import { PresenterTabsNavigation } from "~/components/features/presenter/presenter-tabs-navigation";
import { usePresenterEvent } from "~/components/providers/presenter-event-provider";
import { useEffect } from "react";

export function PresenterActivitiesPageClient() {
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

  // Dispatch custom event for navigation count updates
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("questions-updated"));
  }, [questions.length]);

  // Extract data for easier access
  const activities = activitiesQuery.data ?? [];

  // Mutations
  const createActivityMutation = api.activities.create.useMutation();
  const updateActivityMutation = api.activities.update.useMutation();
  const deleteActivityMutation = api.activities.delete.useMutation();
  const reorderActivitiesMutation = api.activities.reorder.useMutation();
  const updatePresenterStateMutation = api.presenter.updateState.useMutation();

  const handleCreateActivity = async (createActivity: CreateActivity) => {
    await createActivityMutation.mutateAsync(createActivity);
    await activitiesQuery.refetch();
  };

  const handleUpdateActivity = async (
    activityId: number,
    updates: Partial<Activity>,
  ) => {
    await updateActivityMutation.mutateAsync({ id: activityId, ...updates });
    await activitiesQuery.refetch();
  };

  const handleDeleteActivity = async (activityId: number) => {
    await deleteActivityMutation.mutateAsync({ id: activityId });
    await activitiesQuery.refetch();
  };

  const handleReorderActivities = async (activityIds: number[]) => {
    await reorderActivitiesMutation.mutateAsync({ activityIds });
    await activitiesQuery.refetch();
  };

  const handleStartActivity = async (activity: Activity) => {
    // Update the activity's startedAt if it's a timer and add the activityId
    const activityData =
      activity.data.type === "timer"
        ? { ...activity.data, startedAt: new Date(), activityId: activity.id }
        : { ...activity.data, activityId: activity.id };

    // For activities started from the activity manager, just update presenter state
    // Don't create a new activity since it already exists
    await updatePresenterStateMutation.mutateAsync({
      eventId,
      currentPage: activity.type,
      data: activityData,
    });
  };

  return (
    <div>
      <div>
        <PresenterTabsNavigation eventId={eventId} currentPage="activities" />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityManagerSplit
                eventId={eventId}
                activities={activities}
                onCreateActivity={handleCreateActivity}
                onUpdateActivity={handleUpdateActivity}
                onDeleteActivity={handleDeleteActivity}
                onReorderActivities={handleReorderActivities}
                onStartActivity={handleStartActivity}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
