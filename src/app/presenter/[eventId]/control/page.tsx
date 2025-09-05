import "server-only";
import { PresenterControlPageClient } from "./presenter-control-client";

export default async function PresenterControlPage() {
  // Event data is provided by the layout via PresenterEventProvider
  return <PresenterControlPageClient />;
}
