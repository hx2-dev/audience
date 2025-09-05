import "server-only";
import { redirect } from "next/navigation";

export default async function PresenterPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId: eventIdParam } = await params;
  const eventId = parseInt(eventIdParam);

  redirect(`/presenter/${eventId}/control`);
}
