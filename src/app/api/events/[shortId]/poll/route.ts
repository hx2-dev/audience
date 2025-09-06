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
    createdAt: number;
    request: NextRequest;
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

    const now = Date.now();
    const staleThreshold = 30 * 1000; // 30 seconds
    const disconnectedPolls: Array<{
      resolve: (message: PollMessage) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
      createdAt: number;
      request: NextRequest;
    }> = [];

    // Attempt to resolve polls, but with timeout protection
    polls.forEach((poll) => {
      try {
        // Check if request is potentially disconnected
        const isStale = now - poll.createdAt > staleThreshold;
        const isAborted = poll.request.signal?.aborted;
        
        if (isAborted || isStale) {
          disconnectedPolls.push(poll);
          return;
        }

        // Try to resolve with a short timeout
        clearTimeout(poll.timeout);
        
        // Use a Promise.race to avoid hanging on potentially dead connections
        Promise.race([
          Promise.resolve().then(() => poll.resolve(message)),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Resolve timeout")), 100)
          )
        ]).catch(() => {
          // If resolve times out, treat as disconnected
          disconnectedPolls.push(poll);
        });
      } catch {
        // If we can't access the poll, it's likely disconnected
        disconnectedPolls.push(poll);
      }
    });

    // Clean up disconnected/stale polls
    disconnectedPolls.forEach((poll) => {
      clearTimeout(poll.timeout);
      polls.delete(poll);
    });

    // Clear all remaining polls after attempting broadcast
    polls.clear();
  }
}

export function getPollingConnectionCount(shortId: string): number {
  const polls = pendingPolls.get(shortId);
  return polls ? polls.size : 0;
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
      // Set up 1-minute timeout
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
      polls.add({ 
        resolve, 
        reject, 
        timeout, 
        createdAt: Date.now(),
        request 
      });
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
