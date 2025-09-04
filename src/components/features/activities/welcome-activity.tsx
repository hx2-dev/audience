import type { z } from "zod";
import type { welcomeActivityValidator } from "~/core/features/presenter/types";

interface WelcomeActivityProps {
  data: z.infer<typeof welcomeActivityValidator>;
}

export function WelcomeActivity({ data }: WelcomeActivityProps) {
  return (
    <div className="text-center py-8 sm:py-12">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 break-words">
        {data.title ?? "Welcome!"}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg max-w-2xl mx-auto break-words px-4">
        {data.subtitle ?? "The presentation will begin shortly."}
      </p>
    </div>
  );
}