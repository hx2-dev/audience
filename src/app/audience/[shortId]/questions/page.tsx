import "server-only";
import "reflect-metadata";

import { redirect } from "next/navigation";
import { auth, createSigninUrl } from "~/core/generic/auth";
import { AudienceQuestionsPageClient } from "./audience-questions-client";
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
      title: `${event.title} - Questions`,
      description: event.description ?? `Ask questions for ${event.title}`,
    };
  } catch {
    return { title: `Event ${shortId.toUpperCase()}` };
  }
}

export default async function AudienceQuestionsPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const session = await auth();
  const { shortId } = await params;

  if (!session) {
    redirect(createSigninUrl(`/audience/${shortId}/questions`));
  }

  if (!shortId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">
            Missing Event ID
          </h1>
          <p className="text-gray-600">No event ID was provided.</p>
        </div>
      </div>
    );
  }

  // Fetch event data server-side
  const eventService = container.resolve(EventService);
  const eventResult = await eventService.getByShortId(shortId)();

  if (E.isLeft(eventResult)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">
            Event Not Found
          </h1>
          <p className="text-gray-600">
            The event with ID &quot;{shortId.toUpperCase()}&quot; could not be
            found.
          </p>
        </div>
      </div>
    );
  }

  const event = eventResult.right;

  return (
    <AudienceQuestionsPageClient
      shortId={shortId}
      session={session}
      initialEvent={event}
    />
  );
}