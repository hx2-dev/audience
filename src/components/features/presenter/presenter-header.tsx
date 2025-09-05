"use client";

import { Badge } from "~/components/ui/badge";
import type { Event } from "~/core/features/events/types";

interface PresenterHeaderProps {
  event: Event;
  isConnected: boolean;
}

export function PresenterHeader({
  event,
  isConnected,
}: PresenterHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold break-words text-gray-900 sm:text-3xl dark:text-gray-100">
            {event.title}
          </h1>
          {event.description && (
            <p className="mt-1 text-sm break-words text-gray-600 sm:text-base dark:text-gray-300">
              {event.description}
            </p>
          )}
        </div>
        <div className="lg:shrink-0 lg:text-right">
          <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row lg:flex-col lg:items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Status:
              </span>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className="shrink-0"
              >
                {isConnected ? "Connected" : "Connecting..."}
              </Badge>
            </div>
            <Badge
              variant="outline"
              className="font-mono text-base sm:text-lg"
            >
              {event.shortId ?? "No ID"}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
            Share this ID with your audience
          </p>
        </div>
      </div>
    </div>
  );
}