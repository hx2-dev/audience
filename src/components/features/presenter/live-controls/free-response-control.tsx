"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { ActivityData } from "~/core/features/presenter/types";

interface FreeResponseControlProps {
  onStart: (data: ActivityData) => Promise<void>;
  isUpdating: boolean;
}

export function FreeResponseControl({ onStart, isUpdating }: FreeResponseControlProps) {
  const [frQuestion, setFrQuestion] = useState("");
  const [frPlaceholder, setFrPlaceholder] = useState("");
  const [frMaxLength, setFrMaxLength] = useState<number | undefined>(undefined);

  const handleSubmit = () => {
    if (frQuestion.trim()) {
      void onStart({
        type: "free-response",
        question: frQuestion,
        placeholder: frPlaceholder.trim() || undefined,
        maxLength: frMaxLength,
      });
    }
  };

  return (
    <Card className="bg-slate-100 dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Free Response Question</CardTitle>
        <CardDescription>Ask an open-ended question</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="fr-question">Question</Label>
          <Textarea
            id="fr-question"
            placeholder="What do you think about...?"
            value={frQuestion}
            onChange={(e) => setFrQuestion(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="fr-placeholder">Placeholder (optional)</Label>
          <Input
            id="fr-placeholder"
            placeholder="Enter your thoughts here..."
            value={frPlaceholder}
            onChange={(e) => setFrPlaceholder(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="fr-max-length">Max Length (optional)</Label>
          <Input
            id="fr-max-length"
            type="number"
            min={10}
            max={1000}
            placeholder="500"
            value={frMaxLength ?? ""}
            onChange={(e) => setFrMaxLength(e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!frQuestion.trim() || isUpdating}
          className="w-full"
        >
          Show Question
        </Button>
      </CardContent>
    </Card>
  );
}