"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import type { Activity, CreateActivity } from "~/core/features/activities/types";
import type { ActivityData } from "~/core/features/presenter/types";

interface ActivityManagerProps {
  eventId: number;
  activities: Activity[];
  onCreateActivity: (activity: CreateActivity) => Promise<void>;
  onUpdateActivity: (activityId: number, updates: Partial<Activity>) => Promise<void>;
  onDeleteActivity: (activityId: number) => Promise<void>;
  onReorderActivities: (activityIds: number[]) => Promise<void>;
  onStartActivity: (activity: Activity) => Promise<void>;
}

export function ActivityManager({
  eventId,
  activities,
  onCreateActivity,
  onUpdateActivity: _onUpdateActivity,
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
          startedAt: new Date(), // Will be updated when started
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

  const addMcOption = () => {
    setMcOptions([...mcOptions, ""]);
  };

  const updateMcOption = (index: number, value: string) => {
    const newOptions = [...mcOptions];
    newOptions[index] = value;
    setMcOptions(newOptions);
  };

  const removeMcOption = (index: number) => {
    if (mcOptions.length > 2) {
      setMcOptions(mcOptions.filter((_, i) => i !== index));
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
                    <option value="break">Break</option>
                    <option value="thank-you">Thank You</option>
                  </select>
                </div>
              </div>

              {/* Activity-specific configuration */}
              {newActivityType === "welcome" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="welcome-title">Title (optional)</Label>
                    <Input
                      id="welcome-title"
                      placeholder="Welcome!"
                      value={welcomeTitle}
                      onChange={(e) => setWelcomeTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="welcome-subtitle">Subtitle (optional)</Label>
                    <Input
                      id="welcome-subtitle"
                      placeholder="The presentation will begin shortly."
                      value={welcomeSubtitle}
                      onChange={(e) => setWelcomeSubtitle(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {newActivityType === "timer" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="timer-title">Timer Title (optional)</Label>
                    <Input
                      id="timer-title"
                      placeholder="Discussion time"
                      value={timerTitle}
                      onChange={(e) => setTimerTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timer-duration">Duration (seconds)</Label>
                    <Input
                      id="timer-duration"
                      type="number"
                      min={10}
                      max={3600}
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {newActivityType === "multiple-choice" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mc-question">Question</Label>
                    <Textarea
                      id="mc-question"
                      placeholder="What is your favorite color?"
                      value={mcQuestion}
                      onChange={(e) => setMcQuestion(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow-multiple"
                      checked={allowMultiple}
                      onCheckedChange={(checked) => setAllowMultiple(checked === true)}
                    />
                    <Label htmlFor="allow-multiple">Allow multiple selections</Label>
                  </div>
                  
                  <div>
                    <Label>Options</Label>
                    <div className="space-y-2 mt-2">
                      {mcOptions.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => updateMcOption(index, e.target.value)}
                          />
                          {mcOptions.length > 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeMcOption(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addMcOption}
                      className="mt-2"
                    >
                      Add Option
                    </Button>
                  </div>
                </div>
              )}

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
            <Card key={activity.id}>
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
                        {activity.data.type === "multiple-choice" && (
                          <Badge variant="outline">
                            {activity.data.options.length} options
                          </Badge>
                        )}
                        {activity.data.type === "timer" && (
                          <Badge variant="outline">
                            {Math.floor(activity.data.durationMs / 1000)}s
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStartActivity(activity)}
                    >
                      Start
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteActivity(activity.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}