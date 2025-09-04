import type { z } from "zod";
import type { thankYouActivityValidator } from "~/core/features/presenter/types";
import { Card, CardContent } from "~/components/ui/card";

interface ThankYouActivityProps {
  data: z.infer<typeof thankYouActivityValidator>;
}

export function ThankYouActivity({ data }: ThankYouActivityProps) {
  return (
    <Card className="border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20">
      <CardContent className="space-y-4 pt-4 text-center sm:space-y-6 sm:pt-6">
        <div className="text-green-600 dark:text-green-400">
          <div className="mb-2 text-4xl">🎉</div>
          <h2 className="text-2xl font-bold sm:text-3xl">Thank You!</h2>
        </div>

        <div className="mx-auto max-w-2xl px-4 text-lg break-words text-gray-700 dark:text-gray-300">
          {data.message ??
            "Thank you for your participation! Have a great day."}
        </div>

        <div className="text-4xl text-green-600 sm:text-5xl dark:text-green-400">
          ✨
        </div>
      </CardContent>
    </Card>
  );
}
