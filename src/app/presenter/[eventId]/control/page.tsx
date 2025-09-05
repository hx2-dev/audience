import "server-only";
import { auth, createSigninUrl } from "~/core/generic/auth";
import { PresenterControlPageClient } from "./presenter-control-client";
import { redirect } from "next/navigation";

export default async function PresenterControlPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  const { eventId: eventIdParam } = await params;
  const eventId = parseInt(eventIdParam);

  if (!session) {
    redirect(createSigninUrl(`/presenter/${eventIdParam}/control`));
  }

  return <PresenterControlPageClient eventId={eventId} session={session} />;
}
