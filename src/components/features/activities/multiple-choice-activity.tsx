"use client";

import { useState } from "react";
import type { z } from "zod";
import type { multipleChoiceQuestionValidator } from "~/core/features/presenter/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";

interface MultipleChoiceActivityProps {
  data: z.infer<typeof multipleChoiceQuestionValidator>;
}

export function MultipleChoiceActivity({ data }: MultipleChoiceActivityProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleOptionChange = (option: string, checked: boolean) => {
    if (data.allowMultiple) {
      setSelectedOptions(prev => 
        checked 
          ? [...prev, option]
          : prev.filter(o => o !== option)
      );
    } else {
      setSelectedOptions(checked ? [option] : []);
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length > 0) {
      setSubmitted(true);
      // Here you would typically send the response to the server
      console.log('Selected options:', selectedOptions);
    }
  };

  const canSubmit = selectedOptions.length > 0;

  if (submitted) {
    return (
      <div className="py-4 sm:py-8">
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400">
          <CardContent className="pt-4 sm:pt-6 text-center">
            <div className="text-green-600 text-base sm:text-lg font-semibold mb-2">
              ✓ Response Submitted
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              Thank you for your response!
            </p>
            <div className="mt-4 text-sm">
              <p className="font-medium">Your selection{selectedOptions.length > 1 ? 's' : ''}:</p>
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                {selectedOptions.map((option, index) => (
                  <span
                    key={index}
                    className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs sm:text-sm break-words max-w-full"
                  >
                    {option}
                  </span>
                ))}
              </div>
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
          <CardTitle className="text-lg sm:text-xl">Multiple Choice Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="text-base sm:text-lg font-medium break-words">
            {data.question}
          </div>
          
          <div className="space-y-3">
            {data.options.map((option, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Checkbox
                  id={`option-${index}`}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => handleOptionChange(option, checked === true)}
                  className="mt-1 shrink-0"
                />
                <label
                  htmlFor={`option-${index}`}
                  className="flex-1 text-sm sm:text-base cursor-pointer p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors break-words min-h-[44px] flex items-center"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>

          {data.allowMultiple && (
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              You can select multiple options
            </p>
          )}
          
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
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