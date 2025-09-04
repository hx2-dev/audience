"use client";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

interface WelcomeFormProps {
  welcomeTitle: string;
  welcomeSubtitle: string;
  onTitleChange: (title: string) => void;
  onSubtitleChange: (subtitle: string) => void;
}

export function WelcomeForm({ welcomeTitle, welcomeSubtitle, onTitleChange, onSubtitleChange }: WelcomeFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="welcome-title">Title (optional)</Label>
        <Input
          id="welcome-title"
          placeholder="Welcome!"
          value={welcomeTitle}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="welcome-subtitle">Subtitle (optional)</Label>
        <Input
          id="welcome-subtitle"
          placeholder="The presentation will begin shortly."
          value={welcomeSubtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
        />
      </div>
    </div>
  );
}