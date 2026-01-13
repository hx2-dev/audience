import "server-only";
import "reflect-metadata";

import { redirect } from "next/navigation";
import { container } from "tsyringe";
import { EventService } from "~/core/features/events/service";
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
    const event = await eventService.getByShortId(shortId);

    if (!event) {
      return { title: `Event ${shortId.toUpperCase()} - Not Found` };
    }

    return {
      title: `${event.title} - Audience`,
      description: event.description ?? `Join the audience for ${event.title}`,
    };
  } catch {
    return { title: `Event ${shortId.toUpperCase()}` };
  }
}

export default async function AudiencePage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;

  redirect(`/audience/${shortId}/activity`);
}
