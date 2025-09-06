"use client";

import { useEffect, useState } from "react";
import type { z } from "zod";
import type { rankingQuestionValidator } from "~/core/features/presenter/types";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useActivityData } from "~/components/features/audience/activity-tab";
import { RankingResults } from "~/components/features/results/ranking-results";

interface RankingActivityProps {
  data: z.infer<typeof rankingQuestionValidator>;
}

export function RankingActivity({ data }: RankingActivityProps) {
  const [rankedItems, setRankedItems] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitResponseMutation = api.responses.submit.useMutation();

  // Get pre-fetched activity data from context
  const { userResponse, allResponses, refetchData } = useActivityData();

  // Reset state when activity changes (when activityId changes)
  useEffect(() => {
    setRankedItems([]);
    setSubmitted(false);
    setIsSubmitting(false);
  }, [data.activityId]);

  // Populate existing response when found
  useEffect(() => {
    if (userResponse && !submitted) {
      const responseData = userResponse.response;
      if (Array.isArray(responseData)) {
        setRankedItems(responseData);
      }
      setSubmitted(true);
    } else if (!userResponse && submitted) {
      // If userResponse is null but we think we submitted, reset state
      setSubmitted(false);
      setRankedItems([]);
    }
  }, [userResponse, submitted]);

  const unrankedItems = data.items.filter(
    (item) => !rankedItems.includes(item),
  );

  const handleItemClick = (item: string) => {
    if (rankedItems.includes(item)) {
      // Remove from ranking
      setRankedItems((prev) => prev.filter((i) => i !== item));
    } else {
      // Add to ranking
      setRankedItems((prev) => [...prev, item]);
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

  const handleSubmit = async () => {
    if (rankedItems.length === data.items.length && data.activityId) {
      setIsSubmitting(true);
      try {
        await submitResponseMutation.mutateAsync({
          activityId: data.activityId,
          response: rankedItems,
        });
        setSubmitted(true);
        // Refetch combined data to get the latest response data
        refetchData();
      } catch (error) {
        console.error("Failed to submit response:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const canSubmit =
    rankedItems.length === data.items.length &&
    data.activityId &&
    !isSubmitting;
  const hasUserResponded = submitted || !!userResponse;
  const showResults = hasUserResponded && allResponses.length > 0;

  if (showResults) {
    return (
      <RankingResults
        data={{
          question: data.question,
          items: data.items,
        }}
        allResponses={allResponses}
        userRanking={rankedItems}
        showSubmissionBanner={submitted}
      />
    );
  }

  if (submitted && !allResponses.length) {
    return (
      <div className="rounded-lg border border-green-500 bg-green-50 p-4 sm:p-6 dark:border-green-400 dark:bg-green-900/20">
        <div className="mb-4 text-center text-base font-semibold text-green-600 sm:text-lg dark:text-green-400">
          ✓ Ranking Submitted
        </div>
        <p className="mb-4 text-center text-sm text-gray-600 sm:text-base dark:text-gray-300">
          Thank you for your ranking!
        </p>
        <div className="space-y-2">
          <p className="text-center font-medium">Your ranking:</p>
          {rankedItems.map((item, index) => (
            <div
              key={item}
              className="flex items-center rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-slate-800"
            >
              <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800 dark:bg-green-900/30 dark:text-green-300">
                {index + 1}
              </span>
              <span className="flex-1 break-words">{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-base font-medium break-words sm:text-lg">
        {data.question}
      </div>

      {rankedItems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-medium">Your Ranking:</h3>
          {rankedItems.map((item, index) => (
            <div
              key={item}
              className="flex items-center rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20"
            >
              <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white dark:bg-blue-600">
                {index + 1}
              </span>
              <span className="flex-1 text-sm break-words sm:text-base">
                {item}
              </span>
              <div className="flex shrink-0 space-x-1">
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
                  onClick={() =>
                    moveItem(index, Math.min(rankedItems.length - 1, index + 1))
                  }
                  disabled={index === rankedItems.length - 1}
                  className="h-8 w-8 p-0"
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleItemClick(item)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
          <h3 className="text-base font-medium">
            {rankedItems.length === 0
              ? "Click to rank items:"
              : "Remaining items:"}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {unrankedItems.map((item) => (
              <Button
                key={item}
                variant="outline"
                onClick={() => handleItemClick(item)}
                className="h-auto min-h-[44px] justify-start p-3 text-left"
              >
                <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-gray-600 dark:bg-slate-700 dark:text-gray-300">
                  ?
                </span>
                <span className="text-sm break-words sm:text-base">{item}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        {rankedItems.length < data.items.length && (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Rank {data.items.length - rankedItems.length} more item
            {data.items.length - rankedItems.length !== 1 ? "s" : ""}
          </p>
        )}

        {!data.activityId ? (
          <div className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
            This activity is not accepting responses yet.
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="min-h-[44px] w-full"
            size="lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Ranking"}
          </Button>
        )}
      </div>
    </div>
  );
}
