"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { ActivityData } from "~/core/features/presenter/types";

interface RankingControlProps {
  onStart: (data: ActivityData) => Promise<void>;
  isUpdating: boolean;
}

export function RankingControl({ onStart, isUpdating }: RankingControlProps) {
  const [rankingQuestion, setRankingQuestion] = useState("");
  const [rankingItems, setRankingItems] = useState(["", ""]);

  const handleSubmit = () => {
    const validItems = rankingItems.filter(item => item.trim());
    if (rankingQuestion.trim() && validItems.length >= 2) {
      void onStart({
        type: "ranking",
        question: rankingQuestion,
        items: validItems,
      });
    }
  };

  const addRankingItem = () => {
    setRankingItems([...rankingItems, ""]);
  };

  const updateRankingItem = (index: number, value: string) => {
    const newItems = [...rankingItems];
    newItems[index] = value;
    setRankingItems(newItems);
  };

  const removeRankingItem = (index: number) => {
    if (rankingItems.length > 2) {
      setRankingItems(rankingItems.filter((_, i) => i !== index));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking Question</CardTitle>
        <CardDescription>Ask participants to rank items in order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ranking-question">Question</Label>
          <Textarea
            id="ranking-question"
            placeholder="Rank these items from most to least important:"
            value={rankingQuestion}
            onChange={(e) => setRankingQuestion(e.target.value)}
          />
        </div>
        
        <div>
          <Label>Items to Rank</Label>
          <div className="space-y-2 mt-2">
            {rankingItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder={`Item ${index + 1}`}
                  value={item}
                  onChange={(e) => updateRankingItem(index, e.target.value)}
                />
                {rankingItems.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRankingItem(index)}
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
            onClick={addRankingItem}
            className="mt-2"
          >
            Add Item
          </Button>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!rankingQuestion.trim() || rankingItems.filter(i => i.trim()).length < 2 || isUpdating}
          className="w-full"
        >
          Show Question
        </Button>
      </CardContent>
    </Card>
  );
}