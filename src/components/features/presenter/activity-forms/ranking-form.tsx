"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface RankingFormProps {
  rankingQuestion: string;
  rankingItems: string[];
  onQuestionChange: (question: string) => void;
  onItemsChange: (items: string[]) => void;
}

export function RankingForm({
  rankingQuestion,
  rankingItems,
  onQuestionChange,
  onItemsChange,
}: RankingFormProps) {
  const updateRankingItem = (index: number, value: string) => {
    const newItems = [...rankingItems];
    newItems[index] = value;
    onItemsChange(newItems);
  };

  const addRankingItem = () => {
    onItemsChange([...rankingItems, ""]);
  };

  const removeRankingItem = (index: number) => {
    if (rankingItems.length > 2) {
      onItemsChange(rankingItems.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="ranking-question">Question</Label>
        <Textarea
          id="ranking-question"
          placeholder="Rank these items in order of preference:"
          value={rankingQuestion}
          onChange={(e) => onQuestionChange(e.target.value)}
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
    </div>
  );
}