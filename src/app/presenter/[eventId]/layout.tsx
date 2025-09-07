import "server-only";
import "reflect-metadata";
import { redirect } from "next/navigation";
import { auth, createSigninUrl } from "~/core/generic/auth";
import { container } from "tsyringe";
import { z } from "zod";
import { EventService } from "~/core/features/events/service";
import * as E from "fp-ts/lib/Either";
import { ForbiddenError, NotFoundError } from "~/core/common/error";
import { Card, CardContent } from "~/components/ui/card";
import { PresenterEventProvider } from "~/components/providers/presenter-event-provider";
import { PresenterLayoutHeader } from "~/components/features/presenter/presenter-layout-header";

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
      <div className="flex items-center justify-center py-20">
        <Card className="bg-background/80 mx-4 w-full max-w-md backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <h1 className="text-destructive font-semibold">Invalid Event ID</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              The event ID provided is not valid.
            </p>
          </CardContent>
        </Card>
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
        <div className="flex items-center justify-center py-20">
          <Card className="bg-background/80 mx-4 w-full max-w-md backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <h1 className="text-destructive text-xl font-semibold">
                Access Denied
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                You don&apos;t have permission to access the presenter controls
                for this event.
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                Only the event creator can access these controls.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (accessResult.left instanceof NotFoundError) {
      return (
        <div className="flex items-center justify-center py-20">
          <Card className="bg-background/80 mx-4 w-full max-w-md backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <h1 className="text-destructive text-xl font-semibold">
                Event Not Found
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                The event you&apos;re looking for doesn&apos;t exist.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Other errors
    throw accessResult.left;
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="bg-background/80 mx-4 w-full max-w-md backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <h1 className="text-destructive text-xl font-semibold">Error</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              An error occurred while accessing this event.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, provide event data to children
  const event = accessResult.right;

  return (
    <PresenterEventProvider event={event} eventId={eventId} session={session}>
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 xl:max-w-7xl">
        <PresenterLayoutHeader />
        {children}
      </div>
    </PresenterEventProvider>
  );
}
