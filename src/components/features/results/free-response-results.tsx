"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { FreeResponseResult } from "~/core/features/activities/results";

interface FreeResponseResultsProps {
  result: FreeResponseResult;
  userResponse?: string;
  showSubmissionBanner?: boolean;
}

export function FreeResponseResults({
  result,
  userResponse = "",
  showSubmissionBanner = false,
}: FreeResponseResultsProps) {
  return (
    <div className="space-y-4">
      {showSubmissionBanner && (
        <Card className="border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20">
          <CardContent className="pt-4 sm:pt-6">
            <div className="mb-4 text-center text-base font-semibold text-green-600 sm:text-lg dark:text-green-400">
              ✓ Response Submitted
            </div>
            <p className="mb-4 text-center text-sm text-gray-600 sm:text-base dark:text-gray-300">
              Thank you for your response!
            </p>
            {userResponse && (
              <div className="space-y-2">
                <p className="text-center font-medium">Your response:</p>
                <div className="rounded-lg border border-green-200 bg-white p-3 dark:border-green-700 dark:bg-slate-800">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    &ldquo;{userResponse}&rdquo;
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Response Results</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {result.totalResponses} response
            {result.totalResponses !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.responses.map((response, index) => {
            const isUserResponse = userResponse.trim().toLowerCase() === response.text;

            return (
              <div
                key={`${response.text}-${index}`}
                className="rounded-lg border border-gray-200 bg-slate-50 p-3 sm:p-4 dark:border-gray-700 dark:bg-slate-800"
              >
                <div className="mb-2 flex items-start justify-between gap-4">
                  <span
                    className={`text-sm break-words sm:text-base ${
                      isUserResponse
                        ? "font-medium text-green-700 dark:text-green-300"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {isUserResponse && "✓ "}
                    &ldquo;{response.text}&rdquo;
                  </span>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-gray-600 sm:text-sm dark:text-gray-400">
                    <span>{response.count} times</span>
                    <span className="font-semibold">
                      {response.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isUserResponse
                        ? "bg-green-500 dark:bg-green-400"
                        : "bg-blue-500 dark:bg-blue-400"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, response.percentage))}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
          {result.responses.length === 0 && (
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
