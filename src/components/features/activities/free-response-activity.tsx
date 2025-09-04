"use client";

import { useState } from "react";
import type { z } from "zod";
import type { freeResponseQuestionValidator } from "~/core/features/presenter/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

interface FreeResponseActivityProps {
  data: z.infer<typeof freeResponseQuestionValidator>;
}

export function FreeResponseActivity({ data }: FreeResponseActivityProps) {
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (response.trim()) {
      setSubmitted(true);
      // Here you would typically send the response to the server
      console.log('Free response:', response);
    }
  };

  const canSubmit = response.trim().length > 0;
  const characterCount = response.length;
  const isOverLimit = data.maxLength ? characterCount > data.maxLength : false;

  if (submitted) {
    return (
      <div className="py-8">
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6 text-center">
            <div className="text-green-600 text-lg font-semibold mb-2">
              ✓ Response Submitted
            </div>
            <p className="text-gray-600">
              Thank you for your response!
            </p>
            <div className="mt-4 p-4 bg-white rounded-lg border text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">Your response:</p>
              <p className="text-gray-800">{response}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Free Response Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg font-medium">
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
            
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                {characterCount} character{characterCount !== 1 ? 's' : ''}
                {data.maxLength && ` of ${data.maxLength}`}
              </span>
              {isOverLimit && (
                <span className="text-red-600 font-medium">
                  Exceeds character limit
                </span>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isOverLimit}
            className="w-full"
            size="lg"
          >
            Submit Response
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}