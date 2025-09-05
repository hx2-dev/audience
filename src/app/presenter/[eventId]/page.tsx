import "server-only";
import { redirect } from "next/navigation";

export default async function PresenterPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  redirect(`/presenter/${eventId}/control`);
}
