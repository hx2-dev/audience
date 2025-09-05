"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import type { Activity, CreateActivity } from "~/core/features/activities/types";
import type { ActivityData } from "~/core/features/presenter/types";
import { ActivityListItem } from "./activity-list/activity-list-item";
import { WelcomeForm } from "./activity-forms/welcome-form";
import { TimerForm } from "./activity-forms/timer-form";
import { MultipleChoiceForm } from "./activity-forms/multiple-choice-form";
import { FreeResponseForm } from "./activity-forms/free-response-form";
import { RankingForm } from "./activity-forms/ranking-form";
import { MarkdownForm } from "./activity-forms/markdown-form";
import { IframeForm } from "./activity-forms/iframe-form";

interface ActivityManagerProps {
  eventId: number;
  activities: Activity[];
  onCreateActivity: (activity: CreateActivity) => Promise<void>;
  onUpdateActivity: (activityId: number, updates: Partial<Activity>) => Promise<void>;
  onDeleteActivity: (activityId: number) => Promise<void>;
  onReorderActivities: (activityIds: number[]) => Promise<void>;
  onStartActivity: (activity: Activity) => Promise<void>;
}

export function ActivityManagerSplit({
  eventId,
  activities,
  onCreateActivity,
  onUpdateActivity,
  onDeleteActivity,
  onReorderActivities: _onReorderActivities,
  onStartActivity,
}: ActivityManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityType, setNewActivityType] = useState<ActivityData["type"]>("welcome");
  
  // Activity creation state
  const [welcomeTitle, setWelcomeTitle] = useState("");
  const [welcomeSubtitle, setWelcomeSubtitle] = useState("");
  const [timerDuration, setTimerDuration] = useState(300);
  const [timerTitle, setTimerTitle] = useState("");
  const [mcQuestion, setMcQuestion] = useState("");
  const [mcOptions, setMcOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [frQuestion, setFrQuestion] = useState("");
  const [frPlaceholder, setFrPlaceholder] = useState("");
  const [frMaxLength, setFrMaxLength] = useState<number | undefined>(undefined);
  const [rankingQuestion, setRankingQuestion] = useState("");
  const [rankingItems, setRankingItems] = useState(["", ""]);
  const [markdownTitle, setMarkdownTitle] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  const [iframeTitle, setIframeTitle] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");
  const [iframeDescription, setIframeDescription] = useState("");

  const resetForm = () => {
    setNewActivityName("");
    setNewActivityType("welcome");
    setWelcomeTitle("");
    setWelcomeSubtitle("");
    setTimerDuration(300);
    setTimerTitle("");
    setMcQuestion("");
    setMcOptions(["", ""]);
    setAllowMultiple(false);
    setFrQuestion("");
    setFrPlaceholder("");
    setFrMaxLength(undefined);
    setRankingQuestion("");
    setRankingItems(["", ""]);
    setMarkdownTitle("");
    setMarkdownContent("");
    setIframeTitle("");
    setIframeUrl("");
    setIframeDescription("");
  };

  const handleCreateActivity = async () => {
    if (!newActivityName.trim()) return;

    let activityData: ActivityData;

    switch (newActivityType) {
      case "welcome":
        activityData = {
          type: "welcome",
          title: welcomeTitle.trim() || undefined,
          subtitle: welcomeSubtitle.trim() || undefined,
        };
        break;
      case "timer":
        activityData = {
          type: "timer",
          durationMs: timerDuration * 1000,
          startedAt: new Date(),
          title: timerTitle.trim() || undefined,
        };
        break;
      case "multiple-choice":
        const validOptions = mcOptions.filter(opt => opt.trim());
        if (validOptions.length < 2) return;
        activityData = {
          type: "multiple-choice",
          question: mcQuestion,
          options: validOptions,
          allowMultiple,
        };
        break;
      case "free-response":
        if (!frQuestion.trim()) return;
        activityData = {
          type: "free-response",
          question: frQuestion,
          placeholder: frPlaceholder.trim() || undefined,
          maxLength: frMaxLength,
        };
        break;
      case "ranking":
        const validItems = rankingItems.filter(item => item.trim());
        if (validItems.length < 2 || !rankingQuestion.trim()) return;
        activityData = {
          type: "ranking",
          question: rankingQuestion,
          items: validItems,
        };
        break;
      case "markdown":
        if (!markdownContent.trim()) return;
        activityData = {
          type: "markdown",
          title: markdownTitle.trim() || undefined,
          content: markdownContent,
        };
        break;
      case "iframe":
        if (!iframeTitle.trim() || !iframeUrl.trim()) return;
        activityData = {
          type: "iframe",
          title: iframeTitle,
          url: iframeUrl,
          description: iframeDescription.trim() || undefined,
        };
        break;
      default:
        return;
    }

    const createActivity: CreateActivity = {
      eventId,
      name: newActivityName,
      type: newActivityType,
      data: activityData,
      order: activities.length,
    };

    await onCreateActivity(createActivity);
    resetForm();
    setIsCreating(false);
  };

  const renderActivityForm = () => {
    switch (newActivityType) {
      case "welcome":
        return (
          <WelcomeForm
            welcomeTitle={welcomeTitle}
            welcomeSubtitle={welcomeSubtitle}
            onTitleChange={setWelcomeTitle}
            onSubtitleChange={setWelcomeSubtitle}
          />
        );
      case "timer":
        return (
          <TimerForm
            timerDuration={timerDuration}
            timerTitle={timerTitle}
            onDurationChange={setTimerDuration}
            onTitleChange={setTimerTitle}
          />
        );
      case "multiple-choice":
        return (
          <MultipleChoiceForm
            mcQuestion={mcQuestion}
            mcOptions={mcOptions}
            allowMultiple={allowMultiple}
            onQuestionChange={setMcQuestion}
            onOptionsChange={setMcOptions}
            onAllowMultipleChange={setAllowMultiple}
          />
        );
      case "free-response":
        return (
          <FreeResponseForm
            frQuestion={frQuestion}
            frPlaceholder={frPlaceholder}
            frMaxLength={frMaxLength}
            onQuestionChange={setFrQuestion}
            onPlaceholderChange={setFrPlaceholder}
            onMaxLengthChange={setFrMaxLength}
          />
        );
      case "ranking":
        return (
          <RankingForm
            rankingQuestion={rankingQuestion}
            rankingItems={rankingItems}
            onQuestionChange={setRankingQuestion}
            onItemsChange={setRankingItems}
          />
        );
      case "markdown":
        return (
          <MarkdownForm
            markdownTitle={markdownTitle}
            markdownContent={markdownContent}
            onTitleChange={setMarkdownTitle}
            onContentChange={setMarkdownContent}
          />
        );
      case "iframe":
        return (
          <IframeForm
            iframeTitle={iframeTitle}
            iframeUrl={iframeUrl}
            iframeDescription={iframeDescription}
            onTitleChange={setIframeTitle}
            onUrlChange={setIframeUrl}
            onDescriptionChange={setIframeDescription}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activities ({activities.length})</h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>Create Activity</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Activity</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activity-name">Activity Name</Label>
                  <Input
                    id="activity-name"
                    placeholder="Welcome Message"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="activity-type">Activity Type</Label>
                  <select
                    id="activity-type"
                    value={newActivityType}
                    onChange={(e) => setNewActivityType(e.target.value as ActivityData["type"])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="welcome">Welcome</option>
                    <option value="timer">Timer</option>
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="free-response">Free Response</option>
                    <option value="ranking">Ranking</option>
                    <option value="markdown">Markdown Content</option>
                    <option value="iframe">Iframe/Web Content</option>
                    <option value="break">Break</option>
                    <option value="thank-you">Thank You</option>
                  </select>
                </div>
              </div>

              {/* Activity-specific configuration using form components */}
              {["welcome", "timer", "multiple-choice", "free-response", "ranking", "markdown", "iframe"].includes(newActivityType) && renderActivityForm()}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateActivity}
                  disabled={!newActivityName.trim()}
                >
                  Create Activity
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500 py-8">
                <p className="mb-4">No activities created yet.</p>
                <p className="text-sm">Create your first activity to get started!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          activities.map((activity, index) => (
            <ActivityListItem
              key={activity.id}
              activity={activity}
              index={index}
              onUpdate={onUpdateActivity}
              onDelete={onDeleteActivity}
              onStart={onStartActivity}
            />
          ))
        )}
      </div>
    </div>
  );
}