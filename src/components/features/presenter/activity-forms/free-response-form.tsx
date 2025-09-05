"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface FreeResponseFormProps {
  frQuestion: string;
  frPlaceholder: string;
  frMaxLength: number | undefined;
  onQuestionChange: (question: string) => void;
  onPlaceholderChange: (placeholder: string) => void;
  onMaxLengthChange: (maxLength: number | undefined) => void;
}

export function FreeResponseForm({
  frQuestion,
  frPlaceholder,
  frMaxLength,
  onQuestionChange,
  onPlaceholderChange,
  onMaxLengthChange,
}: FreeResponseFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fr-question">Question</Label>
        <Textarea
          id="fr-question"
          placeholder="What do you think about this topic?"
          value={frQuestion}
          onChange={(e) => onQuestionChange(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="fr-placeholder">Placeholder (optional)</Label>
        <Input
          id="fr-placeholder"
          placeholder="Enter your thoughts here..."
          value={frPlaceholder}
          onChange={(e) => onPlaceholderChange(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="fr-max-length">Maximum Length (optional)</Label>
        <Input
          id="fr-max-length"
          type="number"
          min={1}
          max={5000}
          placeholder="500"
          value={frMaxLength?.toString() ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            onMaxLengthChange(value ? Number(value) : undefined);
          }}
        />
      </div>
    </div>
  );
}