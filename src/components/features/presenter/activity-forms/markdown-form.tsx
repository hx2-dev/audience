"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface MarkdownFormProps {
  markdownTitle: string;
  markdownContent: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}

export function MarkdownForm({ 
  markdownTitle, 
  markdownContent, 
  onTitleChange, 
  onContentChange 
}: MarkdownFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="markdown-title">Title (optional)</Label>
        <Input
          id="markdown-title"
          placeholder="Content Title"
          value={markdownTitle}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="markdown-content">Markdown Content</Label>
        <Textarea
          id="markdown-content"
          placeholder="# Heading&#10;&#10;Some **bold** and *italic* text.&#10;&#10;- Bullet point 1&#10;- Bullet point 2"
          value={markdownContent}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Supports basic markdown: # headers, **bold**, *italic*, `code`, - bullets
        </p>
      </div>
    </div>
  );
}