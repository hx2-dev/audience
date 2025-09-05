import Link from "next/link";
import { HydrateClient } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

export default async function Home() {
  return (
    <HydrateClient>
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          {/* Title */}
          <h1 className="text-foreground mb-6 text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl">
            hx2{" "}
            <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
              Audience
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground mb-8 text-lg sm:text-xl md:text-2xl">
            Join interactive events and engage with real-time activities
          </p>

          {/* Join Event Card */}
          <Card className="mx-auto max-w-md">
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-card-foreground mb-2 text-2xl font-semibold">
                  Join an Event
                </h2>
                <p className="text-muted-foreground text-sm">
                  Enter an event code to join the audience and participate in
                  real-time activities
                </p>
              </div>

              <Button asChild size="lg" className="w-full">
                <Link href="/join">Join Event</Link>
              </Button>
            </div>
          </Card>

          {/* Features */}
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-slate-800">
              <div className="mb-3 text-2xl">🎯</div>
              <h3 className="text-card-foreground mb-2 font-semibold">
                Interactive Activities
              </h3>
              <p className="text-muted-foreground text-sm">
                Participate in polls, Q&A sessions, and real-time activities
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-slate-800">
              <div className="mb-3 text-2xl">⚡</div>
              <h3 className="text-card-foreground mb-2 font-semibold">
                Real-time Updates
              </h3>
              <p className="text-muted-foreground text-sm">
                Get instant updates and see live responses from other
                participants
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1 dark:bg-slate-800">
              <div className="mb-3 text-2xl">🔗</div>
              <h3 className="text-card-foreground mb-2 font-semibold">
                Easy to Join
              </h3>
              <p className="text-muted-foreground text-sm">
                Simply enter an event code to join - no registration required
              </p>
            </div>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
