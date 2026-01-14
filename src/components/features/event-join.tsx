"use client";

import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function EventJoinForm({
  onJoin,
}: {
  onJoin: (eventId: string) => Promise<void>;
}) {
  const [eventId, setEventId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (completedValue?: string) => {
    const id = completedValue ?? eventId;

    if (id.length !== 6) {
      setError("Please enter a 6-character event ID");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onJoin(id);
    } catch {
      setError("Unable to connect. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl sm:text-2xl">Join Event</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Enter the 6-character event ID to join the presentation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
          <InputOTP
            maxLength={6}
            value={eventId}
            onChange={setEventId}
            className="uppercase"
            onComplete={handleSubmit}
            data-testid="event-id-input"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="max-w-full text-center text-sm break-words text-red-600">
              {error}
            </p>
          )}

          <Button
            data-testid="join-event-button"
            onClick={() => handleSubmit()}
            disabled={eventId.length !== 6 || isLoading}
            className="min-h-[44px] w-full text-base sm:text-lg"
          >
            {isLoading ? "Joining..." : "Join Event"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
