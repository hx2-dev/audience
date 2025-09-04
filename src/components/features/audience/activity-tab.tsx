"use client";

import React from "react";
import { Card, CardContent } from "~/components/ui/card";
import { WelcomeActivity } from "~/components/features/activities/welcome-activity";
import { TimerActivity } from "~/components/features/activities/timer-activity";
import { MultipleChoiceActivity } from "~/components/features/activities/multiple-choice-activity";
import { FreeResponseActivity } from "~/components/features/activities/free-response-activity";
import { RankingActivity } from "~/components/features/activities/ranking-activity";
import { BreakActivity } from "~/components/features/activities/break-activity";
import { ThankYouActivity } from "~/components/features/activities/thank-you-activity";
import { ResultsActivity } from "~/components/features/activities/results-activity";
import type { ActivityResponse } from "~/core/features/responses/types";
import type { PresenterState } from "~/core/features/presenter/types";

// Context for activity data
const ActivityDataContext = React.createContext<{
  userResponse: ActivityResponse | null;
  allResponses: ActivityResponse[];
  refetchData: () => void;
} | null>(null);

export const useActivityData = () => {
  const context = React.useContext(ActivityDataContext);
  return (
    context ?? { userResponse: null, allResponses: [], refetchData: () => { /* no-op */ } }
  );
};

interface ActivityTabProps {
  presenterState: PresenterState;
  userResponse: ActivityResponse | null;
  allResponses: ActivityResponse[];
  refetchData: () => void;
}

export function ActivityTab({
  presenterState,
  userResponse,
  allResponses,
  refetchData,
}: ActivityTabProps) {
  const renderCurrentPage = () => {
    if (!presenterState) {
      return (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          Waiting for presenter to start...
        </div>
      );
    }

    if (!presenterState.data) {
      return (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No activity data available
        </div>
      );
    }

    const activityContextValue = {
      userResponse: userResponse ?? null,
      allResponses: allResponses ?? [],
      refetchData,
    };

    return (
      <ActivityDataContext.Provider value={activityContextValue}>
        {(() => {
          switch (presenterState.data.type) {
            case "welcome":
              return <WelcomeActivity data={presenterState.data} />;
            case "timer":
              return <TimerActivity data={presenterState.data} />;
            case "multiple-choice":
              return <MultipleChoiceActivity data={presenterState.data} />;
            case "free-response":
              return <FreeResponseActivity data={presenterState.data} />;
            case "ranking":
              return <RankingActivity data={presenterState.data} />;
            case "break":
              return <BreakActivity data={presenterState.data} />;
            case "thank-you":
              return <ThankYouActivity data={presenterState.data} />;
            case "results":
              return <ResultsActivity data={presenterState.data} />;
            default: {
              const unknownData = presenterState.data as { type: string };
              return (
                <div className="py-8">
                  <Card>
                    <CardContent className="pt-6">
                      <h2 className="mb-4 text-xl font-semibold">
                        Unknown Activity: {unknownData.type}
                      </h2>
                      <pre className="overflow-auto rounded-lg bg-gray-100 p-4 text-sm dark:bg-gray-800">
                        {JSON.stringify(presenterState.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              );
            }
          }
        })()}
      </ActivityDataContext.Provider>
    );
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">{renderCurrentPage()}</CardContent>
    </Card>
  );
}
