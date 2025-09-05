import type { z } from "zod";
import type { iframeActivityValidator } from "~/core/features/presenter/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface IframeActivityProps {
  data: z.infer<typeof iframeActivityValidator>;
}

export function IframeActivity({ data }: IframeActivityProps) {
  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl break-words">
          {data.title}
        </CardTitle>
        {data.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            {data.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={data.url}
            className="absolute top-0 left-0 w-full h-full border-0 rounded-b-lg"
            title={data.title}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </CardContent>
    </Card>
  );
}