import "server-only";
import { redirect } from "next/navigation";
import { auth, createSigninUrl } from "~/core/generic/auth";

export default async function PresenterPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  const { eventId: eventIdParam } = await params;

  if (!session) {
    redirect(createSigninUrl(`/presenter/${eventIdParam}`));
  }

  const eventId = parseInt(eventIdParam);

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

  // Redirect to the control page by default
  redirect(`/presenter/${eventId}/control`);
}
