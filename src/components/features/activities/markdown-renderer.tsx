"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { codeToHtml } from "shiki";
import {
  Blockquote,
  Code,
  Em,
  H1,
  H2,
  H3,
  H4,
  HR,
  InlineCode,
  LI,
  Link,
  OL,
  P,
  Pre,
  Strong,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  UL,
} from "~/components/ui/typography";
import { Skeleton } from "~/components/ui/skeleton";

interface MarkdownRendererProps {
  content: string;
}

interface HighlightedCodeBlock {
  code: string;
  html: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [highlightedBlocks, setHighlightedBlocks] = useState<
    Map<string, string>
  >(new Map());
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    async function processCodeBlocks() {
      setIsProcessing(true);
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const blocks: HighlightedCodeBlock[] = [];

      let match;
      while ((match = codeBlockRegex.exec(content)) !== null) {
        const [, language, code] = match;
        const trimmedCode = code?.trim() ?? "";

        console.log("Processing code block:", {
          language,
          codePreview: trimmedCode.substring(0, 50),
        });

        try {
          const html = await codeToHtml(trimmedCode, {
            lang: language ?? "text",
            theme: "catppuccin-mocha", // Use a single theme for now
            transformers: [
              {
                pre(node) {
                  // Add custom classes to the pre element
                  this.addClassToHast(
                    node,
                    "bg-slate-900 text-white p-4 rounded-lg overflow-x-auto font-mono text-sm",
                  );
                },
              },
            ],
          });
          blocks.push({ code: trimmedCode, html });
          console.log("Successfully highlighted code block");
        } catch (error) {
          console.error("Error highlighting code:", error);
          // Use fallback for failed highlighting
          blocks.push({
            code: trimmedCode,
            html: `<pre><code>${trimmedCode}</code></pre>`,
          });
        }
      }

      const newHighlightedBlocks = new Map<string, string>();
      blocks.forEach(({ code, html }) => {
        newHighlightedBlocks.set(code, html);
      });

      setHighlightedBlocks(newHighlightedBlocks);
      setIsProcessing(false);
    }

    void processCodeBlocks();
  }, [content]);

  // Create a custom code component that handles syntax highlighting
  const CodeWithHighlight = ({
    inline,
    className,
    children,
    ..._props
  }: {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => {
    // Handle inline code - must return inline element, not block
    if (inline) {
      return <InlineCode>{children}</InlineCode>;
    }

    // For code blocks, extract the content and check for highlighting
    let codeContent: string | undefined;
    if (typeof children === "string") {
      codeContent = children;
    } else if (Array.isArray(children)) {
      codeContent = children.join("");
    }

    if (typeof codeContent === "string") {
      const trimmedCode = codeContent.trim();
      const highlighted = highlightedBlocks.get(trimmedCode);
      console.log("Code block check:", {
        trimmedCode: trimmedCode.substring(0, 50),
        hasHighlighting: !!highlighted,
        mapSize: highlightedBlocks.size,
      });
      if (highlighted) {
        return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
      }
    }

    // Fallback - for non-highlighted code blocks, just return the code content
    // The Pre wrapper should be handled at a higher level
    return <Code className={className}>{children}</Code>;
  };

  const components: Components = {
    h1: ({ children }) => <H1>{children}</H1>,
    h2: ({ children }) => <H2>{children}</H2>,
    h3: ({ children }) => <H3>{children}</H3>,
    h4: ({ children }) => <H4>{children}</H4>,
    h5: ({ children }) => <H4>{children}</H4>,
    h6: ({ children }) => <H4>{children}</H4>,
    p: ({ children }) => <P>{children}</P>,
    blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
    ul: ({ children }) => <UL>{children}</UL>,
    ol: ({ children }) => <OL>{children}</OL>,
    li: ({ children }) => <LI>{children}</LI>,
    hr: () => <HR />,
    pre: ({ children, ...props }) => {
      // Check if the code component returned highlighted content (div)
      // If so, just pass it through. Otherwise, wrap with Pre.
      if (React.isValidElement(children) && children.type === "div") {
        return <>{children}</>;
      }
      return <Pre {...props}>{children}</Pre>;
    },
    code: CodeWithHighlight,
    strong: ({ children }) => <Strong>{children}</Strong>,
    em: ({ children }) => <Em>{children}</Em>,
    a: ({ href, children }) => <Link href={href}>{children}</Link>,
    // GFM table support
    table: ({ children }) => <Table>{children}</Table>,
    thead: ({ children }) => <THead>{children}</THead>,
    tbody: ({ children }) => <TBody>{children}</TBody>,
    tr: ({ children }) => <TR>{children}</TR>,
    th: ({ children }) => <TH>{children}</TH>,
    td: ({ children }) => <TD>{children}</TD>,
  };

  if (isProcessing) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {content}
    </ReactMarkdown>
  );
}
