"use client";

import { useEffect, useState } from "react";
import type { z } from "zod";
import type { timerActivityValidator } from "~/core/features/presenter/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

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
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.max(0, (timeLeft / data.durationMs) * 100);
  const isComplete = timeLeft === 0;
  
  // Circle properties - responsive sizing
  const size = 240; // Smaller base size for mobile
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = -((100 - progressPercent) / 100 * circumference);

  return (
    <Card
      className={`transition-colors ${isComplete ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20" : "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"}`}
    >
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl break-words sm:text-2xl">
          {data.title ?? "Timer"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md aspect-square">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ${isComplete ? "text-red-500" : "text-blue-500"}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={`font-mono text-3xl font-bold sm:text-4xl lg:text-5xl ${isComplete ? "text-red-600" : "text-blue-600"}`}
            >
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-500 mt-1 sm:text-base dark:text-gray-400">
              / {formatTime(data.durationMs)}
            </div>
          </div>
        </div>

        {isComplete && (
          <div className="text-center">
            <p className="text-base font-semibold text-red-600 sm:text-lg">
              Time&apos;s up!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
