"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { cn } from "~/lib/utils";

interface QuestionsUpdateEvent extends CustomEvent {
  detail: {
    questionsCount: number;
  };
}

interface AudienceTabsNavigationProps {
  shortId: string;
  currentPage: "activity" | "questions";
  questionsCount?: number;
}

export function AudienceTabsNavigation({ shortId, currentPage, questionsCount = 0 }: AudienceTabsNavigationProps) {
  const [currentQuestionsCount, setCurrentQuestionsCount] = useState(questionsCount);

  // Update local state when prop changes
  useEffect(() => {
    setCurrentQuestionsCount(questionsCount);
  }, [questionsCount]);

  // Listen for SSE questions updates
  useEffect(() => {
    const handleQuestionsUpdate = (event: Event) => {
      const questionsEvent = event as QuestionsUpdateEvent;
      if (questionsEvent.detail?.questionsCount !== undefined) {
        setCurrentQuestionsCount(questionsEvent.detail.questionsCount);
      }
    };

    window.addEventListener('questions-updated', handleQuestionsUpdate);
    return () => {
      window.removeEventListener('questions-updated', handleQuestionsUpdate);
    };
  }, []);

  const navItems = [
    { 
      key: "activity", 
      label: "Activity", 
      href: `/audience/${shortId}/activity`,
      icon: null
    },
    { 
      key: "questions", 
      label: `Questions${currentQuestionsCount > 0 ? ` (${currentQuestionsCount})` : ""}`, 
      href: `/audience/${shortId}/questions`,
      icon: MessageSquare
    },
  ];

  return (
    <div className="mb-6">
      {/* Tabs-styled navigation */}
      <div className="bg-muted text-muted-foreground flex h-9 w-full items-center justify-center rounded-lg p-[3px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                // Base styles from TabsTrigger with flex-1 for even distribution
                "text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                // Active state styles
                currentPage === item.key && "bg-background dark:text-foreground shadow-sm dark:border-input dark:bg-input/30",
                // Hover styles
                "hover:bg-background/50"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}