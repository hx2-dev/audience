"use client";

import { useEffect, useState } from "react";
import type { z } from "zod";
import type { timerActivityValidator } from "~/core/features/presenter/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

interface TimerActivityProps {
  data: z.infer<typeof timerActivityValidator>;
}

export function TimerActivity({ data }: TimerActivityProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const startTime = data.startedAt.getTime();
    const endTime = startTime + data.durationMs;
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      setTimeLeft(remaining);
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [data.startedAt, data.durationMs]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = Math.max(0, (timeLeft / data.durationMs) * 100);
  const isComplete = timeLeft === 0;

  return (
    <div className="py-4 sm:py-8">
      <Card className={`transition-colors ${isComplete ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400' : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'}`}>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl sm:text-2xl break-words">
            {data.title ?? "Timer"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="text-center">
            <div className={`text-4xl sm:text-5xl lg:text-6xl font-mono font-bold ${isComplete ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className={`h-3 sm:h-4 ${isComplete ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
            />
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <span>00:00</span>
              <span>{formatTime(data.durationMs)}</span>
            </div>
          </div>
          
          {isComplete && (
            <div className="text-center">
              <p className="text-base sm:text-lg font-semibold text-red-600">Time&apos;s up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}