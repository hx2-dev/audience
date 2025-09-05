import "server-only";
import { auth, createSigninUrl } from "~/core/generic/auth";
import { redirect } from "next/navigation";
import { PresenterResponsesPageClient } from "./presenter-responses-client";

export default async function PresenterResponsesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  const { eventId } = await params;

  if (!session) {
    redirect(createSigninUrl(`/presenter/${eventId}/responses`));
  }

  return <PresenterResponsesPageClient eventId={eventId} session={session} />;
}
