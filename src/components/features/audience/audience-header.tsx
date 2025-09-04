"use client";

import { signOut } from "next-auth/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { LogIn, User } from "lucide-react";
import type { Session } from "next-auth";
import type { Event } from "~/core/features/events/types";

interface AudienceHeaderProps {
  event: Event | undefined;
  shortId: string;
  session: Session;
  isConnected: boolean;
  usingPolling: boolean;
}

export function AudienceHeader({
  event,
  shortId,
  session,
  isConnected,
  usingPolling,
}: AudienceHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-bold break-words sm:text-2xl lg:text-3xl">
        {event?.title ?? `Event: ${shortId.toUpperCase()}`}
      </h1>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Badge
          variant={isConnected ? "default" : "secondary"}
          className="shrink-0"
        >
          {isConnected
            ? usingPolling
              ? "Connected (Polling)"
              : "Connected"
            : "Connecting..."}
        </Badge>
        {session?.user && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {session.user.name}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              title="Sign out"
            >
              <LogIn className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}