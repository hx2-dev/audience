import "reflect-metadata";
import type { NextRequest } from "next/server";
import { container } from "tsyringe";
import { EventService } from "~/core/features/events/service";
import * as E from "fp-ts/lib/Either";

export interface PollMessage {
  type: "refresh" | "no-op";
  data?: {
    refreshTypes: Array<
      "presenter-state" | "questions" | "activities" | "activity-responses"
    >;
  };
}

// Store pending listeners for long polling
const pendingPolls = new Map<
  string,
  Set<{
    resolve: (message: PollMessage) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>
>();

export function broadcastToPollClients(
  shortId: string,
  refreshTypes: Array<
    "presenter-state" | "questions" | "activities" | "activity-responses"
  > = ["presenter-state"],
) {
  const polls = pendingPolls.get(shortId);
  if (polls && polls.size > 0) {
    const message: PollMessage = {
      type: "refresh",
      data: { refreshTypes },
    };

    // Resolve all pending polls for this event
    polls.forEach((poll) => {
      clearTimeout(poll.timeout);
      poll.resolve(message);
    });

    // Clear the polls after responding
    polls.clear();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  try {
    const { shortId } = await params;

    const eventService = container.resolve<EventService>(EventService);
    const eventResult = await eventService.getByShortId(shortId)();

    if (E.isLeft(eventResult)) {
      return new Response("Event not found", { status: 404 });
    }

    // Set up the long polling promise
    const pollPromise = new Promise<PollMessage>((resolve, reject) => {
      // Set up 4-minute timeout
      const timeout = setTimeout(
        () => {
          // Remove this poll from pending
          const polls = pendingPolls.get(shortId);
          if (polls) {
            polls.forEach((poll) => {
              if (poll.resolve === resolve) {
                polls.delete(poll);
              }
            });
          }

          // Respond with no-op after timeout
          resolve({
            type: "no-op",
          });
        },
        1 * 60 * 1000,
      ); // 1 minute

      // Add to pending polls
      if (!pendingPolls.has(shortId)) {
        pendingPolls.set(shortId, new Set());
      }

      const polls = pendingPolls.get(shortId)!;
      polls.add({ resolve, reject, timeout });
    });

    // Wait for either data or timeout
    const result = await pollPromise;

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("Error in polling route:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
