import "server-only";
import { redirect } from "next/navigation";
import { auth } from "~/core/generic/auth";
import { AudiencePageClient } from "./audience-client";

export default async function AudiencePage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  const shortId = (await params).shortId;

  if (!shortId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">
            Missing Event ID
          </h1>
          <p className="text-gray-600">No event ID was provided.</p>
        </div>
      </div>
    );
  }

  return <AudiencePageClient shortId={shortId} session={session} />;
}
