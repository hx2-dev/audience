import "server-only";
import { PresenterActivitiesPageClient } from "./presenter-activities-client";

export default async function PresenterActivitiesPage() {
  // Event data is provided by the layout via PresenterEventProvider
  return <PresenterActivitiesPageClient />;
}
