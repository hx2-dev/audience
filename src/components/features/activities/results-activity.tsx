"use client";

import React from "react";
import type { z } from "zod";
import type {
  freeResponseQuestionValidator,
  multipleChoiceQuestionValidator,
  rankingQuestionValidator,
  resultsActivityValidator,
} from "~/core/features/presenter/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

interface ResultsActivityProps {
  data: z.infer<typeof resultsActivityValidator>;
}

export function ResultsActivity({ data }: ResultsActivityProps) {
  // Fetch the original activity to get its data
  const { data: activity, isLoading: activityLoading } =
    api.activities.getById.useQuery(
      { id: data.activityId },
      { enabled: !!data.activityId },
    );

  // Fetch responses for aggregation
  const { data: responses = [], isLoading: responsesLoading } =
    api.responses.getByActivityId.useQuery(
      { activityId: data.activityId },
      { enabled: !!data.activityId },
    );

  // Calculate aggregated results based on activity type
  const aggregatedResults = React.useMemo(() => {
    if (!responses.length || !activity) return null;

    const totalResponses = responses.length;

    if (activity.type === "multiple-choice") {
      const activityData = activity.data as z.infer<
        typeof multipleChoiceQuestionValidator
      >;
      const optionCounts: Record<string, number> = {};

      responses.forEach((response) => {
        const responseData = response.response;
        if (Array.isArray(responseData)) {
          // Multiple selection
          responseData.forEach((option: string) => {
            optionCounts[option] = (optionCounts[option] || 0) + 1;
          });
        } else if (typeof responseData === "string") {
          // Single selection
          optionCounts[responseData] = (optionCounts[responseData] || 0) + 1;
        }
      });

      return {
        type: "multiple-choice",
        question: activityData.question,
        options: activityData.options,
        optionCounts,
        totalResponses,
        percentages: Object.fromEntries(
          Object.entries(optionCounts).map(([option, count]) => [
            option,
            Math.round((count / totalResponses) * 100),
          ]),
        ),
      };
    }

    if (activity.type === "ranking") {
      const activityData = activity.data as z.infer<
        typeof rankingQuestionValidator
      >;
      const positionScores: Record<string, number> = {};

      responses.forEach((response) => {
        const ranking = response.response as string[];
        ranking.forEach((item, position) => {
          // Higher position = lower score (1st place = highest score)
          const score = ranking.length - position;
          positionScores[item] = (positionScores[item] || 0) + score;
        });
      });

      const sortedItems = Object.entries(positionScores)
        .sort(([, a], [, b]) => b - a)
        .map(([item, score]) => ({
          item,
          score,
          averagePosition:
            (responses.length * activityData.items.length - score) /
              responses.length +
            1,
        }));

      return {
        type: "ranking",
        question: activityData.question,
        items: activityData.items,
        sortedItems,
        totalResponses,
      };
    }

    // For free response, just show response count
    if (activity.type === "free-response") {
      const activityData = activity.data as z.infer<
        typeof freeResponseQuestionValidator
      >;
      return {
        type: "free-response",
        question: activityData.question,
        totalResponses,
      };
    }

    return null;
  }, [responses, activity]);

  if (activityLoading || responsesLoading) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Loading results...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activity || !aggregatedResults) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No results available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {data.title || "Activity Results"}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {aggregatedResults.totalResponses} total response
            {aggregatedResults.totalResponses !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg font-medium break-words">
            {aggregatedResults.question}
          </div>

          {aggregatedResults.type === "multiple-choice" && (
            <div className="space-y-3">
              {aggregatedResults.options.map((option: string) => {
                const count = aggregatedResults.optionCounts[option] ?? 0;
                const percentage = aggregatedResults.percentages[option] ?? 0;

                return (
                  <div key={option} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base">{option}</span>
                      <span className="text-sm font-medium">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-3 rounded-full bg-blue-500 dark:bg-blue-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {aggregatedResults.type === "ranking" && (
            <div className="space-y-3">
              {aggregatedResults.sortedItems.map((item: any, index: number) => (
                <div
                  key={item.item}
                  className="flex items-center rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                >
                  <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white dark:bg-blue-600">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-medium sm:text-base">
                      {item.item}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Average position: {item.averagePosition.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{item.score} pts</div>
                </div>
              ))}
            </div>
          )}

          {aggregatedResults.type === "free-response" && (
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p>Free response results are available in the presenter view.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
