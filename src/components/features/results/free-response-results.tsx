"use client";

import React from "react";
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
  const aggregatedResults = React.useMemo((): AggregatedResults => {
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
      if (typeof responseData === 'string') {
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
    <div className="py-4 sm:py-8 space-y-4">
      {showSubmissionBanner && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400">
          <CardContent className="pt-4 sm:pt-6 text-center">
            <div className="text-green-600 dark:text-green-400 text-base sm:text-lg font-semibold mb-2">
              ✓ Response Submitted
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Thank you for your response!
            </p>
            <div className="mt-4 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border text-left">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your response:</p>
              <p className="text-gray-800 dark:text-gray-200 text-sm sm:text-base break-words">{userResponse}</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Responses</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {aggregatedResults.totalResponses} total response{aggregatedResults.totalResponses !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {aggregatedResults.responses.map((item, index) => {
            const isUserResponse = userResponse.trim().toLowerCase() === item.text.toLowerCase();
            
            return (
              <div key={index} className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start gap-3">
                  <p className={`text-sm sm:text-base break-words flex-1 ${
                    isUserResponse ? 'font-semibold text-green-700 dark:text-green-300' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {isUserResponse && '✓ '}{item.text}
                  </p>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0">
                    {item.count} {item.count === 1 ? 'response' : 'responses'}
                  </span>
                </div>
              </div>
            );
          })}
          {aggregatedResults.responses.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No responses yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}