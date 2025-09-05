"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { ActivityData } from "~/core/features/presenter/types";

interface TimerControlProps {
  onStart: (data: ActivityData) => Promise<void>;
  isUpdating: boolean;
}

export function TimerControl({ onStart, isUpdating }: TimerControlProps) {
  const [timerDuration, setTimerDuration] = useState(300);
  const [timerTitle, setTimerTitle] = useState("");

  const handleTimerStart = () => {
    void onStart({
      type: "timer",
      durationMs: timerDuration * 1000,
      startedAt: new Date(),
      title: timerTitle.trim() || undefined,
    });
  };

  return (
    <Card className="bg-slate-100 dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Timer</CardTitle>
        <CardDescription>Start a countdown timer for activities</CardDescription>
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
  );
}