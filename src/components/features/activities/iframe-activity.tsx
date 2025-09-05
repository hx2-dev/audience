import type { z } from "zod";
import type { iframeActivityValidator } from "~/core/features/presenter/types";
import { H2, P } from "~/components/ui/typography";

interface IframeActivityProps {
  data: z.infer<typeof iframeActivityValidator>;
}

export function IframeActivity({ data }: IframeActivityProps) {
  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe
        src={data.url}
        className="absolute top-0 left-0 h-full w-full rounded-b-lg border-0"
        title={data.title}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
