"use client";

import { useEffect, useState, useCallback } from "react";
import type { z } from "zod";
import type { multipleChoiceQuestionValidator } from "~/core/features/presenter/types";
import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";
import { useActivityData } from "~/components/features/audience/activity-tab";
import { useDebounce } from "~/components/hooks/use-debounce";

interface MultipleChoiceActivityProps {
  data: z.infer<typeof multipleChoiceQuestionValidator>;
}

export function MultipleChoiceActivity({ data }: MultipleChoiceActivityProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingOptions, setSubmittingOptions] = useState<string[]>([]);

  const submitResponseMutation = api.responses.submit.useMutation();

  // Get pre-fetched activity data from context
  const { userResponse, refetchData } = useActivityData();


  // Reset state when activity changes (when activityId changes)
  useEffect(() => {
    setSelectedOptions([]);
    setIsSubmitting(false);
    setSubmittingOptions([]);
  }, [data.activityId]);

  // Populate existing response when found
  useEffect(() => {
    if (userResponse) {
      const responseData = userResponse.response;
      if (Array.isArray(responseData)) {
        setSelectedOptions(responseData);
      } else if (typeof responseData === "string") {
        setSelectedOptions([responseData]);
      }
    } else {
      setSelectedOptions([]);
    }
  }, [userResponse]);

  // Note: SSE response updates are handled at the parent level via refetchCombinedData()
  // The context automatically provides updated allResponses when the parent refetches

  const submitResponse = useCallback(async (options: string[]) => {
    if (data.activityId && options.length > 0 && !isSubmitting) {
      setIsSubmitting(true);
      setSubmittingOptions(options);
      try {
        await submitResponseMutation.mutateAsync({
          activityId: data.activityId,
          response: options,
        });
        // Refetch combined data to get the latest response data
        refetchData();
      } catch (error) {
        console.error("Failed to submit response:", error);
      } finally {
        setIsSubmitting(false);
        setSubmittingOptions([]);
      }
    }
  }, [data.activityId, isSubmitting, submitResponseMutation, refetchData]);

  const debouncedSubmitResponse = useDebounce(submitResponse, 300);

  const handleOptionChange = (option: string, checked: boolean) => {
    let newOptions: string[];
    if (data.allowMultiple) {
      newOptions = checked ? [...selectedOptions, option] : selectedOptions.filter((o) => o !== option);
    } else {
      newOptions = checked ? [option] : [];
    }
    
    setSelectedOptions(newOptions);
    
    // Auto-submit with debouncing
    if (newOptions.length > 0) {
      void debouncedSubmitResponse(newOptions);
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-base font-medium break-words sm:text-lg">
        {data.question}
      </div>

      <div className="space-y-3">
        {data.options.map((option, index) => {
          const isSubmittingThisOption = submittingOptions.includes(option);
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                {isSubmittingThisOption ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                ) : (
                  <Checkbox
                    id={`option-${index}`}
                    checked={selectedOptions.includes(option)}
                    onCheckedChange={(checked) =>
                      handleOptionChange(option, checked === true)
                    }
                  />
                )}
              </div>
              <label
                htmlFor={`option-${index}`}
                className="flex min-h-[44px] flex-1 cursor-pointer items-center rounded-lg border border-gray-200 p-3 text-sm break-words transition-colors hover:bg-slate-50 sm:p-4 sm:text-base dark:border-gray-700 dark:hover:bg-slate-800"
              >
                {option}
              </label>
            </div>
          );
        })}
      </div>

      {data.allowMultiple && (
        <p className="text-sm text-gray-600 italic dark:text-gray-400">
          You can select multiple options
        </p>
      )}

      {!data.activityId && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          This activity is not accepting responses yet.
        </div>
      )}
    </div>
  );
}
