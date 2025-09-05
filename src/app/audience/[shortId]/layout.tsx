import "server-only";
import "reflect-metadata";
import { redirect } from "next/navigation";
import { auth, createSigninUrl } from "~/core/generic/auth";
import { container } from "tsyringe";
import { EventService } from "~/core/features/events/service";
import * as E from "fp-ts/lib/Either";
import { Card, CardContent } from "~/components/ui/card";
import { EventProvider } from "~/components/providers/event-provider";
import { AudienceLayoutHeader } from "~/components/features/audience/audience-layout-header";
import { Badge } from "~/components/ui/badge";

export default async function AudienceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const session = await auth();

  // Check authentication
  if (!session) {
    redirect(createSigninUrl(`/audience/${shortId}`));
  }

  // Validate shortId
  if (!shortId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="bg-background/80 mx-4 w-full max-w-md backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <h1 className="text-destructive font-semibold">Missing Event ID</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              No event ID was provided.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch and validate event
  const eventService = container.resolve(EventService);
  const eventResult = await eventService.getByShortId(shortId)();

  if (E.isLeft(eventResult)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="bg-background/80 mx-4 w-full max-w-md backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <h1 className="text-destructive font-semibold">Event Not Found</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              The event with ID
              <Badge
                variant="outline"
                className="mx-2 font-mono text-base sm:text-lg"
              >
                {shortId.toUpperCase()}
              </Badge>
              could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Event is valid, provide it to children
  const event = eventResult.right;

  return (
    <EventProvider event={event} shortId={shortId} session={session}>
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <AudienceLayoutHeader />
        {children}
      </div>
    </EventProvider>
  );
}
