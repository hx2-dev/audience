"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { ActivityResponse } from "~/core/features/responses/types";

export interface FreeResponseResultsData {
  question: string;
  placeholder?: string;
  maxLength?: number;
}

interface FreeResponseResultsProps {
  data: FreeResponseResultsData;
  allResponses: ActivityResponse[];
  userResponse: string;
  showSubmissionBanner?: boolean;
}

interface ResponseItem {
  text: string;
  count: number;
}

interface AggregatedResults {
  responses: ResponseItem[];
  totalResponses: number;
}

export function FreeResponseResults({
  data: _data,
  allResponses,
  userResponse,
  showSubmissionBanner = false,
}: FreeResponseResultsProps) {
  // Calculate aggregated results
  const aggregatedResults = useMemo((): AggregatedResults => {
    if (!allResponses.length) {
      return {
        responses: [],
        totalResponses: 0,
      };
    }

    // Normalize and aggregate responses
    const responseMap = new Map<string, { text: string; count: number }>();

    allResponses.forEach((response) => {
      const responseData = response.response;
      if (typeof responseData === "string") {
        // Normalize: trim and convert to lowercase for grouping
        const normalized = responseData.trim().toLowerCase();
        const original = responseData.trim();

        if (normalized) {
          const existing = responseMap.get(normalized);
          if (existing) {
            existing.count += 1;
          } else {
            responseMap.set(normalized, { text: original, count: 1 });
          }
        }
      }
    });

    // Sort by count (descending) and take top 10
    const sortedResponses = Array.from(responseMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      responses: sortedResponses,
      totalResponses: allResponses.length,
    };
  }, [allResponses]);

  return (
    <div className="space-y-4">
      {showSubmissionBanner && (
        <Card className="mb-4 border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20">
          <CardContent className="pt-4 text-center sm:pt-6">
            <div className="mb-2 text-base font-semibold text-green-600 sm:text-lg dark:text-green-400">
              ✓ Response Submitted
            </div>
            <p className="text-sm text-gray-600 sm:text-base dark:text-gray-300">
              Thank you for your response!
            </p>
            <div className="mt-4 rounded-lg border bg-white p-3 text-left sm:p-4 dark:bg-slate-800">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Your response:
              </p>
              <p className="text-sm break-words text-gray-800 sm:text-base dark:text-gray-200">
                {userResponse}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Responses</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {aggregatedResults.totalResponses} total response
            {aggregatedResults.totalResponses !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {aggregatedResults.responses.map((item, index) => {
            const isUserResponse =
              userResponse.trim().toLowerCase() === item.text.toLowerCase();

            return (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-slate-50 p-3 sm:p-4 dark:border-gray-700 dark:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={`flex-1 text-sm break-words sm:text-base ${
                      isUserResponse
                        ? "font-semibold text-green-700 dark:text-green-300"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {isUserResponse && "✓ "}
                    {item.text}
                  </p>
                  <span className="shrink-0 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {item.count} {item.count === 1 ? "response" : "responses"}
                  </span>
                </div>
              </div>
            );
          })}
          {aggregatedResults.responses.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No responses yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
