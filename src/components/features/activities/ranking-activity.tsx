"use client";

import { useState } from "react";
import type { z } from "zod";
import type { rankingQuestionValidator } from "~/core/features/presenter/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

interface RankingActivityProps {
  data: z.infer<typeof rankingQuestionValidator>;
}

export function RankingActivity({ data }: RankingActivityProps) {
  const [rankedItems, setRankedItems] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const unrankedItems = data.items.filter(item => !rankedItems.includes(item));

  const handleItemClick = (item: string) => {
    if (rankedItems.includes(item)) {
      // Remove from ranking
      setRankedItems(prev => prev.filter(i => i !== item));
    } else {
      // Add to ranking
      setRankedItems(prev => [...prev, item]);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newRanking = [...rankedItems];
    const [movedItem] = newRanking.splice(fromIndex, 1);
    if (movedItem) {
      newRanking.splice(toIndex, 0, movedItem);
      setRankedItems(newRanking);
    }
  };

  const handleSubmit = () => {
    if (rankedItems.length === data.items.length) {
      setSubmitted(true);
      // Here you would typically send the ranking to the server
      console.log('Ranking:', rankedItems);
    }
  };

  const canSubmit = rankedItems.length === data.items.length;

  if (submitted) {
    return (
      <div className="py-4 sm:py-8">
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
              {rankedItems.map((item, index) => (
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
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-8">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Ranking Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="text-base sm:text-lg font-medium break-words">
            {data.question}
          </div>

          {rankedItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-base">Your Ranking:</h3>
              {rankedItems.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
                >
                  <span className="w-8 h-8 bg-blue-500 dark:bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1 break-words text-sm sm:text-base">{item}</span>
                  <div className="flex space-x-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveItem(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveItem(index, Math.min(rankedItems.length - 1, index + 1))}
                      disabled={index === rankedItems.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleItemClick(item)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 h-8 w-8 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {unrankedItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-base">
                {rankedItems.length === 0 ? "Click to rank items:" : "Remaining items:"}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {unrankedItems.map((item) => (
                  <Button
                    key={item}
                    variant="outline"
                    onClick={() => handleItemClick(item)}
                    className="justify-start text-left h-auto p-3 min-h-[44px]"
                  >
                    <span className="w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0">
                      ?
                    </span>
                    <span className="break-words text-sm sm:text-base">{item}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center">
            {rankedItems.length < data.items.length && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Rank {data.items.length - rankedItems.length} more item{data.items.length - rankedItems.length !== 1 ? 's' : ''}
              </p>
            )}
            
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full min-h-[44px]"
              size="lg"
            >
              Submit Ranking
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}