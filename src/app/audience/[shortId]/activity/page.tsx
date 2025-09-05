import "server-only";
import "reflect-metadata";

import { AudienceActivityPageClient } from "./audience-activity-client";
import { container } from "tsyringe";
import { EventService } from "~/core/features/events/service";
import * as E from "fp-ts/lib/Either";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortId: string }>;
}): Promise<Metadata> {
  const shortId = (await params).shortId;

  if (!shortId) {
    return { title: "Event Not Found" };
  }

  try {
    const eventService = container.resolve(EventService);
    const eventResult = await eventService.getByShortId(shortId)();

    if (E.isLeft(eventResult)) {
      return { title: `Event ${shortId.toUpperCase()} - Not Found` };
    }

    const event = eventResult.right;
    return {
      title: `${event.title} - Activity`,
      description: event.description ?? `Join the activity for ${event.title}`,
    };
  } catch {
    return { title: `Event ${shortId.toUpperCase()}` };
  }
}

export default async function AudienceActivityPage() {
  // Event data is provided by the layout via EventProvider
  return <AudienceActivityPageClient />;
}