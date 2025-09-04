"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { PresenterControl } from "~/components/features/presenter-control";
import { ActivityManager } from "~/components/features/activity-manager";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { api } from "~/trpc/react";
import type { ActivityData } from "~/core/features/presenter/types";
import type {
  CreateActivity,
  Activity,
} from "~/core/features/activities/types";

export default function PresenterDashboard() {
  const params = useParams();
  const eventId = parseInt(params.eventId as string);

  // Fetch event data
  const { data: event, isLoading: eventLoading } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: !isNaN(eventId) },
  );

  // Fetch activities for this event
  const { data: activities = [], refetch: refetchActivities } =
    api.activities.getByEventId.useQuery(
      { eventId },
      { enabled: !isNaN(eventId) },
    );

  // Mutations
  const createActivityMutation = api.activities.create.useMutation();
  const updateActivityMutation = api.activities.update.useMutation();
  const deleteActivityMutation = api.activities.delete.useMutation();
  const reorderActivitiesMutation = api.activities.reorder.useMutation();
  const updatePresenterStateMutation = api.presenter.updateState.useMutation();

  const [activeTab, setActiveTab] = useState("control");

  const handleStateUpdate = async (page: string, data?: ActivityData) => {
    await updatePresenterStateMutation.mutateAsync({
      eventId,
      currentPage: page,
      data,
    });
  };

  const handleCreateActivity = async (createActivity: CreateActivity) => {
    await createActivityMutation.mutateAsync(createActivity);
    await refetchActivities();
  };

  const handleUpdateActivity = async (
    activityId: number,
    updates: Partial<Activity>,
  ) => {
    await updateActivityMutation.mutateAsync({ id: activityId, ...updates });
    await refetchActivities();
  };

  const handleDeleteActivity = async (activityId: number) => {
    await deleteActivityMutation.mutateAsync({ id: activityId });
    await refetchActivities();
  };

  const handleReorderActivities = async (activityIds: number[]) => {
    await reorderActivitiesMutation.mutateAsync({ activityIds });
    await refetchActivities();
  };

  const handleStartActivity = async (activity: Activity) => {
    // Update the activity's startedAt if it's a timer
    const activityData =
      activity.data.type === "timer"
        ? { ...activity.data, startedAt: new Date() }
        : activity.data;

    await handleStateUpdate(activity.type, activityData);
  };

  if (!eventId || isNaN(eventId)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Invalid event ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (eventLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Loading event...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Event not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold break-words text-gray-900 sm:text-3xl dark:text-gray-100">
                {event.title}
              </h1>
              {event.description && (
                <p className="mt-1 text-sm break-words text-gray-600 sm:text-base dark:text-gray-300">
                  {event.description}
                </p>
              )}
            </div>
            <div className="lg:shrink-0 lg:text-right">
              <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row lg:flex-col lg:items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Event ID:
                  </span>
                  <ThemeToggle />
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-base sm:text-lg"
                >
                  {event.shortId ?? "No ID"}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                Share this ID with your audience
              </p>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="control" className="text-sm sm:text-base">
              Live Control
            </TabsTrigger>
            <TabsTrigger value="activities" className="text-sm sm:text-base">
              Manage Activities
            </TabsTrigger>
            <TabsTrigger value="responses" className="text-sm sm:text-base">
              View Responses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Presentation Control</CardTitle>
              </CardHeader>
              <CardContent>
                <PresenterControl
                  eventShortId={event.shortId ?? ""}
                  onStateUpdate={handleStateUpdate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityManager
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
          </TabsContent>

          <TabsContent value="responses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audience Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Response viewing interface coming soon...
                  <br />
                  This will show responses from your audience in real-time.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
