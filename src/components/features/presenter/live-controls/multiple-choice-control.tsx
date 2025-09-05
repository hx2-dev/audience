"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import type { ActivityData } from "~/core/features/presenter/types";

interface MultipleChoiceControlProps {
  onStart: (data: ActivityData) => Promise<void>;
  isUpdating: boolean;
}

export function MultipleChoiceControl({ onStart, isUpdating }: MultipleChoiceControlProps) {
  const [mcQuestion, setMcQuestion] = useState("");
  const [mcOptions, setMcOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const handleSubmit = () => {
    const validOptions = mcOptions.filter(option => option.trim());
    if (mcQuestion.trim() && validOptions.length >= 2) {
      void onStart({
        type: "multiple-choice",
        question: mcQuestion,
        options: validOptions,
        allowMultiple,
      });
    }
  };

  const addMcOption = () => {
    setMcOptions([...mcOptions, ""]);
  };

  const updateMcOption = (index: number, value: string) => {
    const newOptions = [...mcOptions];
    newOptions[index] = value;
    setMcOptions(newOptions);
  };

  const removeMcOption = (index: number) => {
    if (mcOptions.length > 2) {
      setMcOptions(mcOptions.filter((_, i) => i !== index));
    }
  };

  return (
    <Card className="bg-slate-100 dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Multiple Choice Question</CardTitle>
        <CardDescription>Create a multiple choice question</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="mc-question">Question</Label>
          <Textarea
            id="mc-question"
            placeholder="What is your favorite color?"
            value={mcQuestion}
            onChange={(e) => setMcQuestion(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow-multiple"
            checked={allowMultiple}
            onCheckedChange={(checked) => setAllowMultiple(checked === true)}
          />
          <Label htmlFor="allow-multiple">Allow multiple selections</Label>
        </div>
        
        <div>
          <Label>Options</Label>
          <div className="space-y-2 mt-2">
            {mcOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateMcOption(index, e.target.value)}
                />
                {mcOptions.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMcOption(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addMcOption}
            className="mt-2"
          >
            Add Option
          </Button>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!mcQuestion.trim() || mcOptions.filter(o => o.trim()).length < 2 || isUpdating}
          className="w-full"
        >
          Show Question
        </Button>
      </CardContent>
    </Card>
  );
}