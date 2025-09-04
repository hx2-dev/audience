"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { LogIn, User } from "lucide-react";
import { ActivityTab } from "~/components/features/audience/activity-tab";
import { AudienceTabsNavigation } from "~/components/features/audience/audience-tabs-navigation";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { api } from "~/trpc/react";
import type { Event } from "~/core/features/events/types";
import type { Session } from "next-auth";
import { useMultiSSEQuery } from "~/components/hooks/use-sse-query";

interface AudienceActivityPageClientProps {
  shortId: string;
  session: Session;
  initialEvent: Event;
}

export function AudienceActivityPageClient({
  shortId,
  session,
  initialEvent,
}: AudienceActivityPageClientProps) {
  // Fetch event data (with initial data from server)
  const { data: event } = api.event.getByShortId.useQuery(
    { shortId },
    {
      initialData: initialEvent,
      refetchOnMount: false,
    },
  );

  // Get presenter state with user response data in one query
  const combinedDataQuery = api.presenter.getStateWithUserResponse.useQuery(
    {
      eventId: event?.id ?? 0,
      userId: session?.user?.id,
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
    window.dispatchEvent(new CustomEvent('questions-updated', {
      detail: { questionsCount: questionsQuery.data?.length ?? 0 }
    }));
  };

  // SSE connection with automatic query integration
  const { isConnected } = useMultiSSEQuery([
    { queryResult: { refetch: enhancedCombinedRefresh }, eventType: "presenter-state" },
    { queryResult: { refetch: enhancedQuestionsRefresh }, eventType: "questions" },
    { queryResult: { refetch: enhancedCombinedRefresh }, eventType: "activity-responses" },
  ], shortId, true);

  // Extract data for easier access
  const combinedData = combinedDataQuery.data;
  const presenterState = combinedData?.presenterState;
  const questions = questionsQuery.data ?? [];

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Event not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100">
                {event.title}
              </h1>
              {event.description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {event.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className="text-xs"
              >
                {isConnected ? "Connected" : "Connecting..."}
              </Badge>
              {session?.user && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="text-xs">{session.user.name}</span>
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
          </div>
          <div className="text-center">
            <Badge
              variant="outline"
              className="font-mono text-base sm:text-lg"
            >
              Event ID: {shortId.toUpperCase()}
            </Badge>
          </div>
        </div>

        <AudienceTabsNavigation 
          shortId={shortId} 
          currentPage="activity" 
          questionsCount={questions.length}
        />

        {/* Activity Content */}
        <ActivityTab
          presenterState={presenterState}
          userResponse={combinedData?.userResponse ?? null}
          allResponses={combinedData?.allResponses ?? []}
          refetchData={combinedDataQuery.refetch}
        />
      </div>
    </div>
  );
}