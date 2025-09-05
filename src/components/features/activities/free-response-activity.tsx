"use client";

import React, { useState, useEffect } from "react";
import type { z } from "zod";
import type { freeResponseQuestionValidator } from "~/core/features/presenter/types";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";
import { useActivityData } from "~/components/features/audience/activity-tab";
import { FreeResponseResults } from "~/components/features/results/free-response-results";

interface FreeResponseActivityProps {
  data: z.infer<typeof freeResponseQuestionValidator>;
}

export function FreeResponseActivity({ data }: FreeResponseActivityProps) {
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitResponseMutation = api.responses.submit.useMutation();

  // Get pre-fetched activity data from context
  const { userResponse, allResponses, refetchData } = useActivityData();

  // Reset state when activity changes (when activityId changes)
  useEffect(() => {
    setResponse("");
    setSubmitted(false);
    setIsSubmitting(false);
  }, [data.activityId]);

  // Populate existing response when found
  useEffect(() => {
    if (userResponse && !submitted) {
      const responseData = userResponse.response;
      if (typeof responseData === "string") {
        setResponse(responseData);
      }
      setSubmitted(true);
    } else if (!userResponse && submitted) {
      // If userResponse is null but we think we submitted, reset state
      setSubmitted(false);
      setResponse("");
    }
  }, [userResponse, submitted]);

  const handleSubmit = async () => {
    if (response.trim() && data.activityId) {
      setIsSubmitting(true);
      try {
        await submitResponseMutation.mutateAsync({
          activityId: data.activityId,
          response: response.trim(),
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
    response.trim().length > 0 && data.activityId && !isSubmitting;
  const characterCount = response.length;
  const isOverLimit = data.maxLength ? characterCount > data.maxLength : false;
  const hasUserResponded = submitted || !!userResponse;
  const showResults = hasUserResponded && allResponses.length > 0;

  if (showResults) {
    return (
      <FreeResponseResults
        data={{
          question: data.question,
          placeholder: data.placeholder,
          maxLength: data.maxLength,
        }}
        allResponses={allResponses}
        userResponse={response}
        showSubmissionBanner={submitted}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
        <div className="text-base font-medium break-words sm:text-lg">
          {data.question}
        </div>

        <div className="space-y-2">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder={data.placeholder ?? "Enter your response here..."}
            className="min-h-32 text-base"
            maxLength={data.maxLength}
          />

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              {characterCount} character{characterCount !== 1 ? "s" : ""}
              {data.maxLength && ` of ${data.maxLength}`}
            </span>
            {isOverLimit && (
              <span className="font-medium text-red-600">
                Exceeds character limit
              </span>
            )}
          </div>
        </div>

        {!data.activityId ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            This activity is not accepting responses yet.
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isOverLimit}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Response"}
          </Button>
        )}
    </div>
  );
}
