import type { z } from "zod";
import type { thankYouActivityValidator } from "~/core/features/presenter/types";
import { Card, CardContent } from "~/components/ui/card";

interface ThankYouActivityProps {
  data: z.infer<typeof thankYouActivityValidator>;
}

export function ThankYouActivity({ data }: ThankYouActivityProps) {
  return (
    <div className="py-4 sm:py-8">
      <Card className="border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400">
        <CardContent className="pt-4 sm:pt-6 text-center space-y-4 sm:space-y-6">
          <div className="text-green-600 dark:text-green-400">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold">Thank You!</h2>
          </div>
          
          <div className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto break-words px-4">
            {data.message ?? "Thank you for your participation! Have a great day."}
          </div>

          <div className="text-green-600 dark:text-green-400 text-4xl sm:text-5xl">
            ✨
          </div>
        </CardContent>
      </Card>
    </div>
  );
}