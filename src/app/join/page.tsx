import { EventJoinForm } from "~/components/features/event-join";

export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <EventJoinForm />
    </div>
  );
}