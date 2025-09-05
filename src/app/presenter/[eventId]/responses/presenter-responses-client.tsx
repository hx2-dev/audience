"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { LogIn, User } from "lucide-react";
import { ActivityResponseCard } from "~/components/features/presenter/activity-responses/activity-response-card";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { api } from "~/trpc/react";
import type { Session } from "next-auth";
import { useMultiSSEQuery } from "~/components/hooks/use-sse-query";
import type { Activity } from "~/core/features/activities/types";
import { PresenterTabsNavigation } from "~/components/features/presenter/presenter-tabs-navigation";

interface PresenterResponsesPageClientProps {
  eventId: number;
  session: Session;
}

export function PresenterResponsesPageClient({
  eventId,
  session,
}: PresenterResponsesPageClientProps) {
  // Fetch event data
  const { data: event, isLoading: eventLoading } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: !isNaN(eventId) },
  );

  // Fetch activities for this event
  const activitiesQuery = api.activities.getByEventId.useQuery(
    { eventId },
    { enabled: !isNaN(eventId) },
  );

  // Enhanced refetch functions for custom event dispatching
  const enhancedQuestionsRefresh = () => {
    // Dispatch event for navigation to pick up
    window.dispatchEvent(new CustomEvent('questions-updated'));
  };

  const enhancedActivityResponsesRefresh = () => {
    // Dispatch event for individual activity components to pick up
    window.dispatchEvent(new CustomEvent('activity-responses-updated'));
  };

  // SSE connection with automatic query integration
  const { isConnected } = useMultiSSEQuery([
    { queryResult: { refetch: enhancedQuestionsRefresh }, eventType: "questions" },
    { queryResult: activitiesQuery, eventType: "activities" },
    { queryResult: { refetch: enhancedActivityResponsesRefresh }, eventType: "activity-responses" },
  ], event?.shortId, !!event?.shortId);

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
                {event.title} - View Responses
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
                  <Badge
                    variant={isConnected ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {isConnected ? "Connected" : "Connecting..."}
                  </Badge>
                  {session?.user && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <User className="h-3 w-3" />
                        {session.user.name}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut()}
                        title="Sign out"
                      >
                        <LogIn className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  )}
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
                    Create activities in the &ldquo;Manage Activities&rdquo; tab to see responses here.
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