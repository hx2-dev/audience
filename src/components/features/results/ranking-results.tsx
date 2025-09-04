"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { ActivityResponse } from "~/core/features/responses/types";

export interface RankingResultsData {
  question: string;
  items: string[];
}

interface RankingResultsProps {
  data: RankingResultsData;
  allResponses: ActivityResponse[];
  userRanking: string[];
  showSubmissionBanner?: boolean;
}

interface RankingItem {
  item: string;
  averagePosition: number;
  voteCount: number;
  score: number;
}

interface AggregatedResults {
  rankings: RankingItem[];
  totalResponses: number;
}

export function RankingResults({
  data: _data,
  allResponses,
  userRanking,
  showSubmissionBanner = false,
}: RankingResultsProps) {
  // Calculate aggregated results
  const aggregatedResults = React.useMemo((): AggregatedResults => {
    if (!allResponses.length) {
      return {
        rankings: [],
        totalResponses: 0,
      };
    }

    // Calculate average position for each item
    const itemScores = new Map<string, { sum: number; count: number }>();
    
    allResponses.forEach((response) => {
      const responseData = response.response;
      if (Array.isArray(responseData)) {
        responseData.forEach((item: string, index: number) => {
          const position = index + 1; // 1-based position
          const existing = itemScores.get(item);
          if (existing) {
            existing.sum += position;
            existing.count += 1;
          } else {
            itemScores.set(item, { sum: position, count: 1 });
          }
        });
      }
    });

    // Calculate average positions and sort by best average (lowest number)
    const rankedResults = Array.from(itemScores.entries())
      .map(([item, { sum, count }]) => ({
        item,
        averagePosition: sum / count,
        voteCount: count,
        score: Math.round((sum / count) * 100) / 100 // Round to 2 decimal places
      }))
      .sort((a, b) => a.averagePosition - b.averagePosition);

    return {
      rankings: rankedResults,
      totalResponses: allResponses.length,
    };
  }, [allResponses]);

  return (
    <div className="py-4 sm:py-8 space-y-4">
      {showSubmissionBanner && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-green-600 dark:text-green-400 text-base sm:text-lg font-semibold mb-4 text-center">
              ✓ Ranking Submitted
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-4 text-sm sm:text-base">
              Thank you for your ranking!
            </p>
            <div className="space-y-2">
              <p className="font-medium text-center">Your ranking:</p>
              {userRanking.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1 break-words">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Ranking Results</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {aggregatedResults.totalResponses} total response{aggregatedResults.totalResponses !== 1 ? 's' : ''}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {aggregatedResults.rankings.map((item, index) => {
            const isUserRanked = userRanking.includes(item.item);
            const userPosition = userRanking.indexOf(item.item) + 1;
            
            return (
              <div key={item.item} className="p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm sm:text-base break-words font-medium ${
                        isUserRanked ? 'text-green-700 dark:text-green-300' : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {isUserRanked && '✓ '}{item.item}
                      </span>
                      {isUserRanked && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          (You ranked #{userPosition})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span>Avg. position: {item.score}</span>
                      <span>{item.voteCount} vote{item.voteCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {aggregatedResults.rankings.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No rankings yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}