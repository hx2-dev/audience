import "server-only";
import { PresenterResponsesPageClient } from "./presenter-responses-client";

export default async function PresenterResponsesPage() {
  // Event data is provided by the layout via PresenterEventProvider
  return <PresenterResponsesPageClient />;
}
