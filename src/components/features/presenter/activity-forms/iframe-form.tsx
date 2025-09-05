"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface IframeFormProps {
  iframeTitle: string;
  iframeUrl: string;
  iframeDescription: string;
  onTitleChange: (title: string) => void;
  onUrlChange: (url: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function IframeForm({ 
  iframeTitle, 
  iframeUrl, 
  iframeDescription,
  onTitleChange, 
  onUrlChange,
  onDescriptionChange
}: IframeFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="iframe-title">Title</Label>
        <Input
          id="iframe-title"
          placeholder="Interactive Demo"
          value={iframeTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="iframe-url">URL</Label>
        <Input
          id="iframe-url"
          type="url"
          placeholder="https://example.com"
          value={iframeUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Must be a valid URL (https:// recommended)
        </p>
      </div>
      <div>
        <Label htmlFor="iframe-description">Description (optional)</Label>
        <Textarea
          id="iframe-description"
          placeholder="Brief description of what this iframe contains..."
          value={iframeDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
}