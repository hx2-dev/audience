"use client";

import type { z } from "zod";
import type { markdownActivityValidator } from "~/core/features/presenter/types";
import { MarkdownRenderer } from "~/components/features/activities/markdown-renderer";
import "katex/dist/katex.min.css";

interface MarkdownActivityProps {
  data: z.infer<typeof markdownActivityValidator>;
}

export function MarkdownActivity({ data }: MarkdownActivityProps) {
  return <MarkdownRenderer content={data.content} />;
}
