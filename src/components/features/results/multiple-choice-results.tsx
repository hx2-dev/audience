"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { ActivityResponse } from "~/core/features/responses/types";

export interface MultipleChoiceOption {
  value: string;
  label: string;
}

export interface MultipleChoiceResultsData {
  question: string;
  options: string[];
  allowMultiple: boolean;
}

interface MultipleChoiceResultsProps {
  data: MultipleChoiceResultsData;
  allResponses: ActivityResponse[];
  userSelectedOptions: string[];
  showSubmissionBanner?: boolean;
}

interface AggregatedResults {
  optionCounts: Record<string, number>;
  totalResponses: number;
  percentages: Record<string, number>;
}

export function MultipleChoiceResults({
  data,
  allResponses,
  userSelectedOptions,
  showSubmissionBanner = false,
}: MultipleChoiceResultsProps) {
  // Calculate aggregated results
  const aggregatedResults = useMemo((): AggregatedResults => {
    if (!allResponses.length) {
      return {
        optionCounts: {},
        totalResponses: 0,
        percentages: {},
      };
    }

    const optionCounts: Record<string, number> = {};
    const totalResponses = allResponses.length;

    allResponses.forEach((response) => {
      const responseData = response.response;
      if (Array.isArray(responseData)) {
        // Multiple selection
        responseData.forEach((option: string) => {
          optionCounts[option] = (optionCounts[option] ?? 0) + 1;
        });
      } else if (typeof responseData === "string") {
        // Single selection
        optionCounts[responseData] = (optionCounts[responseData] ?? 0) + 1;
      }
    });

    const percentages = Object.fromEntries(
      Object.entries(optionCounts).map(([option, count]) => [
        option,
        Math.round((count / totalResponses) * 100),
      ]),
    );

    return {
      optionCounts,
      totalResponses,
      percentages,
    };
  }, [allResponses]);

  return (
    <>
      {showSubmissionBanner && (
        <Card className="mb-4 border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20">
          <CardContent className="pt-4 text-center sm:pt-6">
            <div className="mb-2 text-base font-semibold text-green-600 sm:text-lg dark:text-green-400">
              ✓ Response Submitted
            </div>
            <p className="text-sm text-gray-600 sm:text-base dark:text-gray-300">
              Thank you for your response!
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Results</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {aggregatedResults.totalResponses} total response
            {aggregatedResults.totalResponses !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.options.map((option) => {
            const count = aggregatedResults.optionCounts[option] ?? 0;
            const percentage = aggregatedResults.percentages[option] ?? 0;
            const isSelected = userSelectedOptions.includes(option);

            return (
              <div key={option} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm sm:text-base ${isSelected ? "font-semibold text-green-700 dark:text-green-300" : ""}`}
                  >
                    {isSelected && "✓ "}
                    {option}
                  </span>
                  <span className="text-sm font-medium">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className={`h-3 rounded-full ${
                      isSelected
                        ? "bg-green-500 dark:bg-green-400"
                        : "bg-blue-500 dark:bg-blue-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
