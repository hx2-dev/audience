"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Edit, Trash2 } from "lucide-react";
import type { Activity } from "~/core/features/activities/types";
import { WelcomeForm } from "../activity-forms/welcome-form";
import { TimerForm } from "../activity-forms/timer-form";
import { MultipleChoiceForm } from "../activity-forms/multiple-choice-form";
import { FreeResponseForm } from "../activity-forms/free-response-form";
import { RankingForm } from "../activity-forms/ranking-form";
import { MarkdownForm } from "../activity-forms/markdown-form";
import { IframeForm } from "../activity-forms/iframe-form";

interface ActivityListItemProps {
  activity: Activity;
  index: number;
  onUpdate: (activityId: number, updates: Partial<Activity>) => Promise<void>;
  onDelete: (activityId: number) => Promise<void>;
  onStart: (activity: Activity) => Promise<void>;
}

export function ActivityListItem({ activity, index, onUpdate, onDelete, onStart }: ActivityListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activity.name);
  
  // Form state for each activity type
  const [welcomeTitle, setWelcomeTitle] = useState(
    activity.data.type === "welcome" ? activity.data.title ?? "" : ""
  );
  const [welcomeSubtitle, setWelcomeSubtitle] = useState(
    activity.data.type === "welcome" ? activity.data.subtitle ?? "" : ""
  );
  const [timerDuration, setTimerDuration] = useState(
    activity.data.type === "timer" ? Math.floor(activity.data.durationMs / 1000) : 300
  );
  const [timerTitle, setTimerTitle] = useState(
    activity.data.type === "timer" ? activity.data.title ?? "" : ""
  );
  const [mcQuestion, setMcQuestion] = useState(
    activity.data.type === "multiple-choice" ? activity.data.question : ""
  );
  const [mcOptions, setMcOptions] = useState(
    activity.data.type === "multiple-choice" ? activity.data.options : ["", ""]
  );
  const [allowMultiple, setAllowMultiple] = useState(
    activity.data.type === "multiple-choice" ? activity.data.allowMultiple : false
  );
  const [frQuestion, setFrQuestion] = useState(
    activity.data.type === "free-response" ? activity.data.question : ""
  );
  const [frPlaceholder, setFrPlaceholder] = useState(
    activity.data.type === "free-response" ? activity.data.placeholder ?? "" : ""
  );
  const [frMaxLength, setFrMaxLength] = useState(
    activity.data.type === "free-response" ? activity.data.maxLength : undefined
  );
  const [rankingQuestion, setRankingQuestion] = useState(
    activity.data.type === "ranking" ? activity.data.question : ""
  );
  const [rankingItems, setRankingItems] = useState(
    activity.data.type === "ranking" ? activity.data.items : ["", ""]
  );
  const [markdownTitle, setMarkdownTitle] = useState(
    activity.data.type === "markdown" ? activity.data.title ?? "" : ""
  );
  const [markdownContent, setMarkdownContent] = useState(
    activity.data.type === "markdown" ? activity.data.content : ""
  );
  const [iframeTitle, setIframeTitle] = useState(
    activity.data.type === "iframe" ? activity.data.title : ""
  );
  const [iframeUrl, setIframeUrl] = useState(
    activity.data.type === "iframe" ? activity.data.url : ""
  );
  const [iframeDescription, setIframeDescription] = useState(
    activity.data.type === "iframe" ? activity.data.description ?? "" : ""
  );

  const handleSave = async () => {
    let updatedData = activity.data;

    switch (activity.data.type) {
      case "welcome":
        updatedData = {
          type: "welcome",
          title: welcomeTitle.trim() || undefined,
          subtitle: welcomeSubtitle.trim() || undefined,
        };
        break;
      case "timer":
        updatedData = {
          type: "timer",
          durationMs: timerDuration * 1000,
          startedAt: activity.data.startedAt,
          title: timerTitle.trim() || undefined,
        };
        break;
      case "multiple-choice":
        const validOptions = mcOptions.filter(opt => opt.trim());
        if (validOptions.length < 2) return;
        updatedData = {
          type: "multiple-choice",
          question: mcQuestion,
          options: validOptions,
          allowMultiple,
        };
        break;
      case "free-response":
        if (!frQuestion.trim()) return;
        updatedData = {
          type: "free-response",
          question: frQuestion,
          placeholder: frPlaceholder.trim() || undefined,
          maxLength: frMaxLength,
        };
        break;
      case "ranking":
        const validItems = rankingItems.filter(item => item.trim());
        if (validItems.length < 2 || !rankingQuestion.trim()) return;
        updatedData = {
          type: "ranking",
          question: rankingQuestion,
          items: validItems,
        };
        break;
      case "markdown":
        if (!markdownContent.trim()) return;
        updatedData = {
          type: "markdown",
          title: markdownTitle.trim() || undefined,
          content: markdownContent,
        };
        break;
      case "iframe":
        if (!iframeTitle.trim() || !iframeUrl.trim()) return;
        updatedData = {
          type: "iframe",
          title: iframeTitle,
          url: iframeUrl,
          description: iframeDescription.trim() || undefined,
        };
        break;
    }

    await onUpdate(activity.id, {
      name: editName,
      data: updatedData,
    });
    setIsEditing(false);
  };

  const getActivityDetails = () => {
    switch (activity.type) {
      case "multiple-choice":
        if (activity.data.type === "multiple-choice") {
          return `${activity.data.options?.length ?? 0} options`;
        }
        return "";
      case "timer":
        if (activity.data.type === "timer") {
          return `${Math.floor(activity.data.durationMs / 1000)}s`;
        }
        return "";
      case "free-response":
        if (activity.data.type === "free-response") {
          return activity.data.maxLength ? `Max ${activity.data.maxLength} chars` : "";
        }
        return "";
      case "ranking":
        if (activity.data.type === "ranking") {
          return `${activity.data.items?.length ?? 0} items`;
        }
        return "";
      case "markdown":
        if (activity.data.type === "markdown") {
          return activity.data.title ?? "Content";
        }
        return "";
      case "iframe":
        if (activity.data.type === "iframe") {
          try {
            return activity.data.url ? new URL(activity.data.url).hostname : "";
          } catch {
            return "Invalid URL";
          }
        }
        return "";
      default:
        return "";
    }
  };

  const renderEditForm = () => {
    switch (activity.data.type) {
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
    <>
      <Card className="bg-slate-100 dark:bg-slate-800">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 font-mono">
                #{index + 1}
              </div>
              <div>
                <h4 className="font-medium">{activity.name}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary">{activity.type}</Badge>
                  {getActivityDetails() && (
                    <Badge variant="outline">
                      {getActivityDetails()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStart(activity)}
              >
                Start
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(activity.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label htmlFor="edit-activity-name">Activity Name</Label>
              <Input
                id="edit-activity-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            {renderEditForm()}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!editName.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}