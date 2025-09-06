"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Checkbox } from "~/components/ui/checkbox";
import type { ActivityData } from "~/core/features/presenter/types";

interface PresenterControlProps {
  eventShortId: string;
  onStateUpdate: (page: string, data?: ActivityData) => Promise<void>;
}

export function PresenterControl({
  eventShortId,
  onStateUpdate,
}: PresenterControlProps) {
  const [currentPage, setCurrentPage] = useState("welcome");
  const [isUpdating, setIsUpdating] = useState(false);

  // Timer state
  const [timerDuration, setTimerDuration] = useState(300); // 5 minutes default
  const [timerTitle, setTimerTitle] = useState("");

  // Multiple choice state
  const [mcQuestion, setMcQuestion] = useState("");
  const [mcOptions, setMcOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  // Free response state
  const [frQuestion, setFrQuestion] = useState("");
  const [frPlaceholder, setFrPlaceholder] = useState("");
  const [frMaxLength, setFrMaxLength] = useState<number | undefined>(undefined);

  // Ranking state
  const [rankingQuestion, setRankingQuestion] = useState("");
  const [rankingItems, setRankingItems] = useState(["", ""]);

  const handlePageChange = async (newPage: string, data?: ActivityData) => {
    setIsUpdating(true);
    try {
      await onStateUpdate(newPage, data);
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Failed to update presenter state:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTimerStart = () => {
    void handlePageChange("timer", {
      type: "timer",
      durationMs: timerDuration * 1000,
      startedAt: new Date(),
      title: timerTitle.trim() || undefined,
    });
  };

  const handleMultipleChoiceSubmit = () => {
    const validOptions = mcOptions.filter((option) => option.trim());
    if (mcQuestion.trim() && validOptions.length >= 2) {
      void handlePageChange("multiple-choice", {
        type: "multiple-choice",
        question: mcQuestion,
        options: validOptions,
        allowMultiple,
      });
    }
  };

  const handleFreeResponseSubmit = () => {
    if (frQuestion.trim()) {
      void handlePageChange("free-response", {
        type: "free-response",
        question: frQuestion,
        placeholder: frPlaceholder.trim() || undefined,
        maxLength: frMaxLength,
      });
    }
  };

  const handleRankingSubmit = () => {
    const validItems = rankingItems.filter((item) => item.trim());
    if (rankingQuestion.trim() && validItems.length >= 2) {
      void handlePageChange("ranking", {
        type: "ranking",
        question: rankingQuestion,
        items: validItems,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Control</CardTitle>
          <CardDescription>
            Control what your audience sees in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Page</Label>
            <Badge className="ml-2">{currentPage}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant={currentPage === "welcome" ? "default" : "outline"}
            onClick={() =>
              void handlePageChange("welcome", { type: "welcome" })
            }
            disabled={isUpdating}
          >
            Welcome
          </Button>
          <Button
            variant="outline"
            onClick={() => void handlePageChange("break", { type: "break" })}
            disabled={isUpdating}
          >
            Break
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              void handlePageChange("thank-you", { type: "thank-you" })
            }
            disabled={isUpdating}
          >
            Thank You
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1">
          <TabsTrigger
            value="timer"
            className="min-w-[120px] flex-grow sm:flex-1 sm:basis-0"
          >
            Timer
          </TabsTrigger>
          <TabsTrigger
            value="multiple-choice"
            className="min-w-[120px] flex-grow sm:flex-1 sm:basis-0"
          >
            Multiple Choice
          </TabsTrigger>
          <TabsTrigger
            value="free-response"
            className="min-w-[120px] flex-grow sm:flex-1 sm:basis-0"
          >
            Free Response
          </TabsTrigger>
          <TabsTrigger
            value="ranking"
            className="min-w-[120px] flex-grow sm:flex-1 sm:basis-0"
          >
            Ranking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Timer</CardTitle>
              <CardDescription>
                Start a countdown timer for activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="timer-title">Timer Title (optional)</Label>
                <Input
                  id="timer-title"
                  placeholder="Discussion time"
                  value={timerTitle}
                  onChange={(e) => setTimerTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="timer-duration">Duration (seconds)</Label>
                <Input
                  id="timer-duration"
                  type="number"
                  min={10}
                  max={3600}
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(Number(e.target.value))}
                />
              </div>
              <Button
                onClick={handleTimerStart}
                disabled={isUpdating}
                className="w-full"
              >
                Start Timer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multiple-choice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multiple Choice Question</CardTitle>
              <CardDescription>
                Create a multiple choice question
              </CardDescription>
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
                  onCheckedChange={(checked) =>
                    setAllowMultiple(checked === true)
                  }
                />
                <Label htmlFor="allow-multiple">
                  Allow multiple selections
                </Label>
              </div>

              <div>
                <Label>Options</Label>
                <div className="mt-2 space-y-2">
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
                onClick={handleMultipleChoiceSubmit}
                disabled={
                  !mcQuestion.trim() ||
                  mcOptions.filter((o) => o.trim()).length < 2 ||
                  isUpdating
                }
                className="w-full"
              >
                Show Question
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="free-response" className="space-y-4">
          <Card>
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
                  onChange={(e) =>
                    setFrMaxLength(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>

              <Button
                onClick={handleFreeResponseSubmit}
                disabled={!frQuestion.trim() || isUpdating}
                className="w-full"
              >
                Show Question
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking Question</CardTitle>
              <CardDescription>
                Ask participants to rank items in order
              </CardDescription>
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
                <div className="mt-2 space-y-2">
                  {rankingItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder={`Item ${index + 1}`}
                        value={item}
                        onChange={(e) =>
                          updateRankingItem(index, e.target.value)
                        }
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
                onClick={handleRankingSubmit}
                disabled={
                  !rankingQuestion.trim() ||
                  rankingItems.filter((i) => i.trim()).length < 2 ||
                  isUpdating
                }
                className="w-full"
              >
                Show Question
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
