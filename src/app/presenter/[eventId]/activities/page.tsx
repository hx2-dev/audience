import "server-only";
import { redirect } from "next/navigation";
import { auth } from "~/core/generic/auth";
import { PresenterActivitiesPageClient } from "./presenter-activities-client";

export default async function PresenterActivitiesPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  const eventId = parseInt(params.eventId);

  if (!eventId || isNaN(eventId)) {
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

  return <PresenterActivitiesPageClient eventId={eventId} session={session} />;
}