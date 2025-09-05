import "server-only";
import "reflect-metadata";
import { redirect } from "next/navigation";
import { auth, createSigninUrl } from "~/core/generic/auth";
import { container } from "tsyringe";
import { z } from "zod";
import { EventService } from "~/core/features/events/service";
import * as E from "fp-ts/lib/Either";
import { ForbiddenError, NotFoundError } from "~/core/common/error";

export default async function PresenterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  const { eventId: eventIdParam } = await params;

  // Check authentication
  if (!session) {
    redirect(createSigninUrl(`/presenter/${eventIdParam}`));
  }

  const eventId = eventIdParam;

  // Check valid event ID (UUID format)
  const uuidResult = z.uuid().safeParse(eventId);
  if (!uuidResult.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">
            Invalid Event ID
          </h1>
          <p className="text-gray-600">The event ID provided is not valid.</p>
        </div>
      </div>
    );
  }

  // Check if user has access to presenter controls
  const eventService = container.resolve(EventService);
  const accessResult = await eventService.checkPresenterAccess(
    eventId,
    session.user.id,
  )();

  if (E.isLeft(accessResult)) {
    if (accessResult.left instanceof ForbiddenError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-semibold text-red-600">
              Access Denied
            </h1>
            <p className="mb-4 text-gray-600">
              You don&apos;t have permission to access the presenter controls
              for this event.
            </p>
            <p className="text-sm text-gray-500">
              Only the event creator can access these controls.
            </p>
          </div>
        </div>
      );
    }

    if (accessResult.left instanceof NotFoundError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-semibold text-red-600">
              Event Not Found
            </h1>
            <p className="text-gray-600">
              The event you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      );
    }

    // Other errors
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-semibold text-red-600">Error</h1>
          <p className="text-gray-600">
            An error occurred while accessing this event.
          </p>
        </div>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}
