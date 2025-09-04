"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface TimerFormProps {
  timerDuration: number;
  timerTitle: string;
  onDurationChange: (duration: number) => void;
  onTitleChange: (title: string) => void;
}

export function TimerForm({ timerDuration, timerTitle, onDurationChange, onTitleChange }: TimerFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="timer-title">Timer Title (optional)</Label>
        <Input
          id="timer-title"
          placeholder="Discussion time"
          value={timerTitle}
          onChange={(e) => onTitleChange(e.target.value)}
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
          onChange={(e) => onDurationChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}