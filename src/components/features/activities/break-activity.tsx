"use client";

import { useEffect, useState } from "react";
import type { z } from "zod";
import type { breakActivityValidator } from "~/core/features/presenter/types";
import { Card, CardContent } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

interface BreakActivityProps {
  data: z.infer<typeof breakActivityValidator>;
}

export function BreakActivity({ data }: BreakActivityProps) {
  const [timeLeft, setTimeLeft] = useState(data.duration ? data.duration * 1000 : 0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!data.duration) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (data.duration! * 1000) - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [data.duration, startTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = data.duration 
    ? Math.max(0, (timeLeft / (data.duration * 1000)) * 100)
    : 0;

  return (
    <div className="py-8">
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-400">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="text-yellow-600">
            <div className="text-4xl mb-2">☕</div>
            <h2 className="text-2xl font-bold">Break Time</h2>
          </div>
          
          <div className="text-lg text-gray-700 dark:text-gray-300">
            {data.message ?? "Take a break! We'll be back shortly."}
          </div>

          {data.duration && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="text-3xl font-mono font-bold text-yellow-600">
                {formatTime(timeLeft)}
              </div>
              
              <div className="space-y-2">
                <Progress 
                  value={progress} 
                  className="h-3 [&>div]:bg-yellow-500"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {timeLeft === 0 ? "Break time is over!" : "Time remaining"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}