"use client";

import React, { useState, useEffect } from "react";
import type { z } from "zod";
import type { multipleChoiceQuestionValidator } from "~/core/features/presenter/types";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";
import { useActivityData } from "~/components/features/audience/activity-tab";
import { MultipleChoiceResults } from "~/components/features/results/multiple-choice-results";

interface MultipleChoiceActivityProps {
  data: z.infer<typeof multipleChoiceQuestionValidator>;
}

export function MultipleChoiceActivity({ data }: MultipleChoiceActivityProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitResponseMutation = api.responses.submit.useMutation();

  // Get pre-fetched activity data from context
  const { userResponse, allResponses, refetchData } = useActivityData();

  // Reset state when activity changes (when activityId changes)
  useEffect(() => {
    setSelectedOptions([]);
    setSubmitted(false);
    setIsSubmitting(false);
  }, [data.activityId]);

  // Populate existing response when found
  useEffect(() => {
    if (userResponse && !submitted) {
      const responseData = userResponse.response;
      if (Array.isArray(responseData)) {
        setSelectedOptions(responseData);
      } else if (typeof responseData === "string") {
        setSelectedOptions([responseData]);
      }
      setSubmitted(true);
    } else if (!userResponse && submitted) {
      // If userResponse is null but we think we submitted, reset state
      setSubmitted(false);
      setSelectedOptions([]);
    }
  }, [userResponse, submitted]);

  // Note: SSE response updates are handled at the parent level via refetchCombinedData()
  // The context automatically provides updated allResponses when the parent refetches


  const handleOptionChange = (option: string, checked: boolean) => {
    if (data.allowMultiple) {
      setSelectedOptions((prev) =>
        checked ? [...prev, option] : prev.filter((o) => o !== option),
      );
    } else {
      setSelectedOptions(checked ? [option] : []);
    }
  };

  const handleSubmit = async () => {
    if (selectedOptions.length > 0 && data.activityId) {
      setIsSubmitting(true);
      try {
        await submitResponseMutation.mutateAsync({
          activityId: data.activityId,
          response: data.allowMultiple ? selectedOptions : selectedOptions[0],
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
    selectedOptions.length > 0 && data.activityId && !isSubmitting;
  const hasUserResponded = submitted || !!userResponse;
  const showResults = hasUserResponded && allResponses.length > 0;

  if (showResults) {
    return (
      <MultipleChoiceResults
        data={{
          question: data.question,
          options: data.options,
          allowMultiple: data.allowMultiple,
        }}
        allResponses={allResponses}
        userSelectedOptions={selectedOptions}
        showSubmissionBanner={submitted}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
        <div className="text-base font-medium break-words sm:text-lg">
          {data.question}
        </div>

        <div className="space-y-3">
          {data.options.map((option, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Checkbox
                id={`option-${index}`}
                checked={selectedOptions.includes(option)}
                onCheckedChange={(checked) =>
                  handleOptionChange(option, checked === true)
                }
                className="mt-1 shrink-0"
              />
              <label
                htmlFor={`option-${index}`}
                className="flex min-h-[44px] flex-1 cursor-pointer items-center rounded-lg border border-gray-200 p-3 text-sm break-words transition-colors hover:bg-gray-50 sm:p-4 sm:text-base dark:border-gray-700 dark:hover:bg-gray-800"
              >
                {option}
              </label>
            </div>
          ))}
        </div>

        {data.allowMultiple && (
          <p className="text-sm text-gray-600 italic dark:text-gray-400">
            You can select multiple options
          </p>
        )}

        {!data.activityId ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            This activity is not accepting responses yet.
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Response"}
          </Button>
        )}
    </div>
  );
}
