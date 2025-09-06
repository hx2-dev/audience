"use client";

import type { z } from "zod";
import type { resultsActivityValidator } from "~/core/features/presenter/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { MultipleChoiceResults } from "~/components/features/results/multiple-choice-results";
import { RankingResults } from "~/components/features/results/ranking-results";
import { FreeResponseResults } from "~/components/features/results/free-response-results";

interface ResultsActivityProps {
  data: z.infer<typeof resultsActivityValidator>;
}

export function ResultsActivity({ data }: ResultsActivityProps) {
  // Fetch processed results from server
  const { data: results, isLoading } = api.activities.getResults.useQuery(
    { activityId: data.activityId },
    { enabled: !!data.activityId }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Results...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-gray-500">
              Processing results...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No results available yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render the appropriate results component based on activity type
  switch (results.activityType) {
    case "multiple-choice":
      return (
        <MultipleChoiceResults
          result={results}
          showSubmissionBanner={false}
        />
      );
      
    case "ranking":
      return (
        <RankingResults
          result={results}
          showSubmissionBanner={false}
        />
      );
      
    case "free-response":
      return (
        <FreeResponseResults
          result={results}
          showSubmissionBanner={false}
        />
      );
      
    default:
      return (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Unsupported activity type for results display
              </p>
            </div>
          </CardContent>
        </Card>
      );
  }
}