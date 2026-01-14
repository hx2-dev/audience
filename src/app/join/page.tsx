"use client";
import { useRouter } from "next/navigation";
import { EventJoinForm } from "~/components/features/event-join";

export default function JoinPage() {
  const router = useRouter();
  const handleJoin = (eventId: string) => {
    router.push(`/audience/${eventId}/activity`);
    return Promise.resolve();
  };

  return (
    <div className="flex items-center justify-center p-4">
      <EventJoinForm onJoin={handleJoin} />
    </div>
  );
}
