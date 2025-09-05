import "server-only";
import { PresenterQuestionsPageClient } from "./presenter-questions-client";

export default async function PresenterQuestionsPage() {
  // Event data is provided by the layout via PresenterEventProvider
  return <PresenterQuestionsPageClient />;
}
