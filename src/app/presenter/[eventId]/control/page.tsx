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
  const { eventId } = await params;

  if (!session) {
    redirect(createSigninUrl(`/presenter/${eventId}/control`));
  }

  return <PresenterControlPageClient eventId={eventId} session={session} />;
}
