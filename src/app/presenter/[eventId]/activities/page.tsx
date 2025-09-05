import "server-only";
import { auth, createSigninUrl } from "~/core/generic/auth";
import { PresenterActivitiesPageClient } from "./presenter-activities-client";
import { redirect } from "next/navigation";

export default async function PresenterActivitiesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  const { eventId: eventIdParam } = await params;
  const eventId = parseInt(eventIdParam);

  if (!session) {
    redirect(createSigninUrl(`/presenter/${eventIdParam}/activities`));
  }

  return <PresenterActivitiesPageClient eventId={eventId} session={session} />;
}
