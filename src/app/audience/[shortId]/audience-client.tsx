"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { MessageSquare } from "lucide-react";
import { api } from "~/trpc/react";
import type { Session } from "next-auth";
import { useMultiSSEQuery } from "~/components/hooks/use-sse-query";
import { ActivityTab } from "~/components/features/audience/activity-tab";
import { QuestionsTab } from "~/components/features/audience/questions-tab";
import { AudienceHeader } from "~/components/features/audience/audience-header";
import type { Event } from "~/core/features/events/types";

interface AudiencePageClientProps {
  shortId: string;
  session: Session;
  initialEvent?: Event;
}

export function AudiencePageClient({
  shortId,
  session,
  initialEvent,
}: AudiencePageClientProps) {
  const [activeTab, setActiveTab] = useState("activity");

  // Use server-side event data or fetch client-side as fallback
  const { data: event } = api.event.getByShortId.useQuery(
    { shortId },
    {
      enabled: !!shortId && !initialEvent,
      initialData: initialEvent,
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

  // Get questions for this event
  const questionsQuery = api.questions.getByEventId.useQuery(
    { eventId: event?.id ?? 0 },
    { enabled: !!event?.id },
  );

  // Enhanced refetch function for activity responses that also dispatches events
  const enhancedCombinedRefetch = () => {
    void combinedDataQuery.refetch();
    // Also dispatch event for any additional listeners
    window.dispatchEvent(new CustomEvent("activity-responses-updated"));
  };

  // SSE connection with automatic query integration
  const { isConnected, error, usingPolling } = useMultiSSEQuery([
    { queryResult: { refetch: enhancedCombinedRefetch }, eventType: "presenter-state" },
    { queryResult: questionsQuery, eventType: "questions" },
    { queryResult: { refetch: enhancedCombinedRefetch }, eventType: "activity-responses" },
  ], shortId, !!shortId);

  // Extract data for easier access
  const combinedData = combinedDataQuery.data;
  const presenterState = combinedData?.presenterState;
  const questions = questionsQuery.data ?? [];

  if (error && !isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <AudienceHeader
          event={event}
          shortId={shortId}
          session={session}
          isConnected={isConnected}
          usingPolling={usingPolling}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity" className="flex items-center gap-2">
              Activity
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Questions {questions.length > 0 && `(${questions.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <ActivityTab
              presenterState={presenterState}
              userResponse={combinedData?.userResponse ?? null}
              allResponses={combinedData?.allResponses ?? []}
              refetchData={combinedDataQuery.refetch}
            />
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            <QuestionsTab
              eventId={event?.id ?? 0}
              session={session}
              questions={questions}
              refetchQuestions={questionsQuery.refetch}
            />
          </TabsContent>
        </Tabs>

        {error && isConnected && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
            <p className="text-sm break-words text-yellow-800 dark:text-yellow-300">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
