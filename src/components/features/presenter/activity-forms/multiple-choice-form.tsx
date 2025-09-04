"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";

interface MultipleChoiceFormProps {
  mcQuestion: string;
  mcOptions: string[];
  allowMultiple: boolean;
  onQuestionChange: (question: string) => void;
  onOptionsChange: (options: string[]) => void;
  onAllowMultipleChange: (allowMultiple: boolean) => void;
}

export function MultipleChoiceForm({
  mcQuestion,
  mcOptions,
  allowMultiple,
  onQuestionChange,
  onOptionsChange,
  onAllowMultipleChange,
}: MultipleChoiceFormProps) {
  const updateMcOption = (index: number, value: string) => {
    const newOptions = [...mcOptions];
    newOptions[index] = value;
    onOptionsChange(newOptions);
  };

  const addMcOption = () => {
    onOptionsChange([...mcOptions, ""]);
  };

  const removeMcOption = (index: number) => {
    if (mcOptions.length > 2) {
      onOptionsChange(mcOptions.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="mc-question">Question</Label>
        <Textarea
          id="mc-question"
          placeholder="What is your favorite color?"
          value={mcQuestion}
          onChange={(e) => onQuestionChange(e.target.value)}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="allow-multiple"
          checked={allowMultiple}
          onCheckedChange={(checked) => onAllowMultipleChange(checked === true)}
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
    </div>
  );
}