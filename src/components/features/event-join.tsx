"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function EventJoinForm() {
  const [eventId, setEventId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (eventId.length !== 6) {
      setError("Please enter a 6-character event ID");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${eventId}/stream`, {
        method: "HEAD",
      });

      if (response.ok) {
        router.push(`/audience/${eventId}/activity`);
      } else if (response.status === 404) {
        setError("Event not found. Please check the event ID.");
      } else {
        setError("Unable to join event. Please try again.");
      }
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
            onClick={handleSubmit}
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
