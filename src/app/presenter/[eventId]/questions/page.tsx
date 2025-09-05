import "server-only";
import { auth, createSigninUrl } from "~/core/generic/auth";
import { PresenterQuestionsPageClient } from "./presenter-questions-client";
import { redirect } from "next/navigation";

export default async function PresenterQuestionsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  const { eventId } = await params;

  if (!session) {
    redirect(createSigninUrl(`/presenter/${eventId}/questions`));
  }

  return <PresenterQuestionsPageClient eventId={eventId} session={session} />;
}
