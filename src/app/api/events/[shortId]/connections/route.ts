import "reflect-metadata";
import type { NextRequest } from "next/server";
import { container } from "tsyringe";
import { EventService } from "~/core/features/events/service";
import * as E from "fp-ts/lib/Either";
import { getConnectionCount } from "../stream/connections";

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

    const connectionCount = await getConnectionCount(shortId);

    return Response.json({ 
      connectionCount,
      shortId 
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });

  } catch (error) {
    console.error("Error in connections route:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}