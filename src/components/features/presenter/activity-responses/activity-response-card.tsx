"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import type { Activity } from "~/core/features/activities/types";

interface ActivityResponseCardProps {
  activity: Activity;
  onShowResults: (activity: Activity) => Promise<void>;
}

export function ActivityResponseCard({
  activity,
  onShowResults,
}: ActivityResponseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const {
    data: responses = [],
    isLoading,
    refetch: refetchResponses,
  } = api.responses.getByActivityId.useQuery({ activityId: activity.id });

  useEffect(() => {
    const handleResponsesUpdate = () => {
      void refetchResponses();
    };

    window.addEventListener(
      "activity-responses-updated",
      handleResponsesUpdate,
    );
    return () => {
      window.removeEventListener(
        "activity-responses-updated",
        handleResponsesUpdate,
      );
    };
  }, [refetchResponses]);

  const formatResponse = (response: 
    | { activityType: "multiple-choice"; responses: string[] }
    | { activityType: "ranking"; responses: string[] }
    | { activityType: "free-response"; responses: string }
    | { activityType: "timer"; responses?: string }
  ): string => {
    switch (response.activityType) {
      case "multiple-choice":
      case "ranking":
        return response.responses.join(", ");
      case "free-response":
        return response.responses;
      case "timer":
        return response.responses ?? "";
    }
  };

  const getActivityTypeDisplay = (type: string): string => {
    switch (type) {
      case "multiple-choice":
        return "Multiple Choice";
      case "free-response":
        return "Free Response";
      case "ranking":
        return "Ranking";
      case "timer":
        return "Timer";
      default:
        return type;
    }
  };

  // Calculate aggregated results
  const aggregatedResults = useMemo(() => {
    if (!responses.length) return null;

    if (activity.type === "multiple-choice") {
      const optionCounts: Record<string, number> = {};

      responses.forEach((response) => {
        if (response.activityType === "multiple-choice" && response.response.activityType === "multiple-choice") {
          response.response.responses.forEach((option: string) => {
            optionCounts[option] = (optionCounts[option] ?? 0) + 1;
          });
        }
      });

      return {
        type: "multiple-choice" as const,
        optionCounts,
        totalResponses: responses.length,
        percentages: Object.fromEntries(
          Object.entries(optionCounts).map(([option, count]) => [
            option,
            Math.round((count / responses.length) * 100),
          ]),
        ),
      };
    }

    if (activity.type === "ranking") {
      const positionScores: Record<string, number> = {};

      responses.forEach((response) => {
        if (response.activityType === "ranking" && response.response.activityType === "ranking") {
          const rankingResponses = response.response.responses;
          rankingResponses.forEach((item: string, position: number) => {
            const score = rankingResponses.length - position;
            positionScores[item] = (positionScores[item] ?? 0) + score;
          });
        }
      });

      const sortedItems = Object.entries(positionScores)
        .sort(([, a], [, b]) => b - a)
        .map(([item, score]) => ({
          item,
          score,
          averagePosition:
            (responses.length *
              (activity.data as { items: string[] }).items.length -
              score) /
              responses.length +
            1,
        }));

      return {
        type: "ranking" as const,
        sortedItems,
        totalResponses: responses.length,
      };
    }

    return {
      type: "free-response" as const,
      totalResponses: responses.length,
    };
  }, [responses, activity]);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {activity.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <Badge variant="outline" className="text-xs">
              {getActivityTypeDisplay(activity.type)}
            </Badge>
            <span>•</span>
            <span>{responses.length} responses</span>
          </div>
        </div>
        <div className="ml-4">
          {responses.length > 0 &&
            ["multiple-choice", "free-response", "ranking"].includes(
              activity.type,
            ) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShowResults(activity)}
                className="text-xs"
              >
                Show Results
              </Button>
            )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-gray-500">
          Loading responses...
        </div>
      ) : responses.length === 0 ? (
        <div className="py-4 text-center text-gray-500 dark:text-gray-400">
          No responses yet for this activity.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Aggregated Results */}
          {aggregatedResults && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Results Overview ({aggregatedResults.totalResponses}{" "}
                  responses)
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs"
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </Button>
              </div>

              {/* Multiple Choice Results */}
              {aggregatedResults.type === "multiple-choice" && (
                <div className="space-y-2">
                  {(activity.data as { options: string[] }).options.map(
                    (option: string) => {
                      const count = aggregatedResults.optionCounts[option] ?? 0;
                      const percentage =
                        aggregatedResults.percentages[option] ?? 0;

                      return (
                        <div key={option} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate pr-2">{option}</span>
                            <span className="shrink-0 font-medium">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-2 rounded-full bg-blue-500 dark:bg-blue-400"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}

              {/* Ranking Results */}
              {aggregatedResults.type === "ranking" && (
                <div className="space-y-2">
                  {aggregatedResults.sortedItems.map(
                    (
                      item: {
                        item: string;
                        score: number;
                        averagePosition: number;
                      },
                      index: number,
                    ) => (
                      <div
                        key={item.item}
                        className="flex items-center rounded bg-slate-50 p-2 dark:bg-slate-800"
                      >
                        <span className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {item.item}
                          </span>
                          <div className="text-xs text-gray-500">
                            Avg: {item.averagePosition.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-xs font-medium">
                          {item.score} pts
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

              {/* Free Response Results */}
              {aggregatedResults.type === "free-response" && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {aggregatedResults.totalResponses} text responses received
                </div>
              )}
            </div>
          )}

          {/* Individual Response Details */}
          {showDetails && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Individual Responses
              </h4>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <pre className="font-mono text-xs whitespace-pre-wrap">
                          {formatResponse(response.response)}
                        </pre>
                      </div>
                      <div className="ml-2 text-xs text-gray-500">
                        {response.userId ? (
                          <span>User: {response.userId.slice(0, 8)}...</span>
                        ) : (
                          <span>Anonymous</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {response.createdAt.toLocaleDateString()} at{" "}
                      {response.createdAt.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
