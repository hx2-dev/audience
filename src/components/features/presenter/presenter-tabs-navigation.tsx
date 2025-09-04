"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface PresenterTabsNavigationProps {
  eventId: number;
  currentPage: "control" | "activities" | "responses" | "questions";
}

export function PresenterTabsNavigation({ eventId, currentPage }: PresenterTabsNavigationProps) {
  // Fetch questions count for the badge
  const { data: questions = [], refetch: refetchQuestions } = api.questions.getByEventIdForPresenter.useQuery(
    { eventId },
    { enabled: !isNaN(eventId) }
  );

  // Listen for SSE questions updates
  useEffect(() => {
    const handleQuestionsUpdate = () => {
      void refetchQuestions();
    };

    window.addEventListener('questions-updated', handleQuestionsUpdate);
    return () => {
      window.removeEventListener('questions-updated', handleQuestionsUpdate);
    };
  }, [refetchQuestions]);

  const navItems = [
    { 
      key: "control", 
      label: "Live Control", 
      href: `/presenter/${eventId}/control` 
    },
    { 
      key: "activities", 
      label: "Manage Activities", 
      href: `/presenter/${eventId}/activities` 
    },
    { 
      key: "responses", 
      label: "View Responses", 
      href: `/presenter/${eventId}/responses` 
    },
    { 
      key: "questions", 
      label: `Q&A Questions${questions.length > 0 ? ` (${questions.length})` : ""}`, 
      href: `/presenter/${eventId}/questions` 
    },
  ];

  return (
    <div className="mb-6">
      {/* Tabs-styled navigation */}
      <div className="bg-muted text-muted-foreground flex h-9 w-full items-center justify-center rounded-lg p-[3px]">
        {navItems.map((item) => (
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
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}