"use client";

import type { z } from "zod";
import type { markdownActivityValidator } from "~/core/features/presenter/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { MarkdownRenderer } from "~/components/features/activities/markdown-renderer";
import "katex/dist/katex.min.css";

interface MarkdownActivityProps {
  data: z.infer<typeof markdownActivityValidator>;
}

export function MarkdownActivity({ data }: MarkdownActivityProps) {
  return (
    <Card className="mx-auto w-full max-w-4xl">
      {data.title && (
        <CardHeader>
          <CardTitle className="text-xl break-words sm:text-2xl">
            {data.title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <MarkdownRenderer content={data.content} />
      </CardContent>
    </Card>
  );
}
