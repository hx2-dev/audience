"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { CheckCircle, Clock, Trash2 } from "lucide-react";
import { PresenterControlSplit } from "~/components/features/presenter/presenter-control-split";
import { ActivityManagerSplit } from "~/components/features/presenter/activity-manager-split";
import { ActivityResponseCard } from "~/components/features/presenter/activity-responses/activity-response-card";
import { api } from "~/trpc/react";
import { useMultiSSEQuery } from "~/components/hooks/use-sse-query";
import type { ActivityData } from "~/core/features/presenter/types";
import type {
  Activity,
  CreateActivity,
} from "~/core/features/activities/types";
import type { Question } from "~/core/features/questions/types";
import { usePresenterEvent } from "~/components/providers/presenter-event-provider";

interface QuestionCardProps {
  question: Question;
  onAnswer: (questionId: number, answer: string) => Promise<void>;
  onDelete: (questionId: number) => Promise<void>;
}

function QuestionCard({ question, onAnswer, onDelete }: QuestionCardProps) {
  const [answer, setAnswer] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    await onAnswer(question.id, answer);
    setAnswer("");
    setIsAnswering(false);
  };

  return (
    <div className="space-y-3 rounded-lg border bg-slate-100 p-4 dark:bg-slate-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {question.question}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {question.createdAt.toLocaleDateString()} at{" "}
            {question.createdAt.toLocaleTimeString()}
            {!question.isAnonymous && question.submitterName && (
              <span>• by {question.submitterName}</span>
            )}
            {question.isAnonymous && <span>• Anonymous</span>}
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2">
          {question.isAnswered && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(question.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {question.isAnswered && question.answer && (
        <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Answer:
          </p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            {question.answer}
          </p>
        </div>
      )}

      {!question.isAnswered && (
        <div className="space-y-2">
          {!isAnswering ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAnswering(true)}
            >
              Answer Question
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmitAnswer}>
                  Submit Answer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAnswering(false);
                    setAnswer("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PresenterDashboardClient() {
  // Get event data from context
  const { event, eventId } = usePresenterEvent();

  // Fetch activities for this event
  const activitiesQuery = api.activities.getByEventId.useQuery(
    { eventId },
    { enabled: !!eventId },
  );

  // Fetch questions for this event
  const questionsQuery = api.questions.getByEventIdForPresenter.useQuery(
    { eventId },
    { enabled: !!eventId },
  );

  // Enhanced refetch for activity responses that also dispatches events
  const enhancedActivityResponsesRefresh = () => {
    // Dispatch event for individual activity components to pick up
    window.dispatchEvent(new CustomEvent("activity-responses-updated"));
  };

  // SSE connection with automatic query integration
  const {} = useMultiSSEQuery(
    [
      { queryResult: questionsQuery, eventType: "questions" },
      { queryResult: activitiesQuery, eventType: "activities" },
      {
        queryResult: { refetch: enhancedActivityResponsesRefresh },
        eventType: "activity-responses",
      },
    ],
    event?.shortId,
    !!event?.shortId,
  );

  // Extract data for easier access
  const activities = activitiesQuery.data ?? [];
  const questions = questionsQuery.data ?? [];

  // Mutations
  const createActivityMutation = api.activities.create.useMutation();
  const updateActivityMutation = api.activities.update.useMutation();
  const deleteActivityMutation = api.activities.delete.useMutation();
  const reorderActivitiesMutation = api.activities.reorder.useMutation();
  const updatePresenterStateMutation = api.presenter.updateState.useMutation();
  const answerQuestionMutation = api.questions.answer.useMutation();
  const deleteQuestionMutation = api.questions.delete.useMutation();

  const [activeTab, setActiveTab] = useState("control");

  const handleStateUpdate = async (page: string, data?: ActivityData) => {
    let updatedData = data;

    // Create a saved activity for all activity types (not just interactive ones)
    if (
      data &&
      [
        "multiple-choice",
        "free-response",
        "ranking",
        "markdown",
        "iframe",
        "timer",
        "welcome",
        "break",
        "thank-you",
      ].includes(data.type)
    ) {
      const getActivityName = (activityData: ActivityData): string => {
        if (activityData.type === "multiple-choice") {
          return `Multiple Choice: ${activityData.question}`;
        }
        if (activityData.type === "free-response") {
          return `Free Response: ${activityData.question}`;
        }
        if (activityData.type === "ranking") {
          return `Ranking: ${activityData.question}`;
        }
        if (activityData.type === "markdown") {
          return `Markdown: ${activityData.title ?? "Content"}`;
        }
        if (activityData.type === "iframe") {
          return `Iframe: ${activityData.title}`;
        }
        if (activityData.type === "timer") {
          return `Timer: ${activityData.title ?? "Countdown"}`;
        }
        if (activityData.type === "welcome") {
          return `Welcome: ${activityData.title ?? "Welcome Message"}`;
        }
        if (activityData.type === "break") {
          return `Break: ${activityData.message ?? "Break Time"}`;
        }
        if (activityData.type === "thank-you") {
          return `Thank You: ${activityData.message ?? "Thank You"}`;
        }
        return `${activityData.type} Activity`;
      };

      const activityName = getActivityName(data);

      const createdActivity = await createActivityMutation.mutateAsync({
        eventId,
        name: activityName.substring(0, 100), // Truncate if too long
        type: data.type,
        data,
      });

      // Add the activityId to the data
      updatedData = { ...data, activityId: createdActivity.id } as ActivityData;

      await activitiesQuery.refetch();
    }

    // Then update the presenter state with the updated data (including activityId)
    await updatePresenterStateMutation.mutateAsync({
      eventId,
      currentPage: page,
      data: updatedData,
    });
  };

  const handleCreateActivity = async (createActivity: CreateActivity) => {
    await createActivityMutation.mutateAsync(createActivity);
    await activitiesQuery.refetch();
  };

  const handleUpdateActivity = async (
    activityId: number,
    updates: Partial<Activity>,
  ) => {
    await updateActivityMutation.mutateAsync({ id: activityId, ...updates });
    await activitiesQuery.refetch();
  };

  const handleDeleteActivity = async (activityId: number) => {
    await deleteActivityMutation.mutateAsync({ id: activityId });
    await activitiesQuery.refetch();
  };

  const handleReorderActivities = async (activityIds: number[]) => {
    await reorderActivitiesMutation.mutateAsync({ activityIds });
    await activitiesQuery.refetch();
  };

  const handleStartActivity = async (activity: Activity) => {
    // Update the activity's startedAt if it's a timer and add the activityId
    const activityData =
      activity.data.type === "timer"
        ? { ...activity.data, startedAt: new Date(), activityId: activity.id }
        : { ...activity.data, activityId: activity.id };

    // For activities started from the activity manager, just update presenter state
    // Don't create a new activity since it already exists
    await updatePresenterStateMutation.mutateAsync({
      eventId,
      currentPage: activity.type,
      data: activityData,
    });
  };

  const handleAnswerQuestion = async (questionId: number, answer: string) => {
    await answerQuestionMutation.mutateAsync({ questionId, answer });
    await questionsQuery.refetch();
  };

  const handleDeleteQuestion = async (questionId: number) => {
    await deleteQuestionMutation.mutateAsync({ id: questionId });
    await questionsQuery.refetch();
  };

  const handleShowResults = async (activity: Activity) => {
    await updatePresenterStateMutation.mutateAsync({
      eventId,
      currentPage: "results",
      data: {
        type: "results",
        activityId: activity.id,
        title: `${activity.name} - Results`,
      },
    });
  };


  return (
    <div>
      <div className="mx-auto max-w-7xl">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="flex h-auto w-full flex-wrap gap-1 p-1">
            <TabsTrigger
              value="control"
              className="min-w-[120px] flex-grow text-sm sm:flex-1 sm:basis-0 sm:text-base"
            >
              Live Control
            </TabsTrigger>
            <TabsTrigger
              value="activities"
              className="min-w-[120px] flex-grow text-sm sm:flex-1 sm:basis-0 sm:text-base"
            >
              Manage Activities
            </TabsTrigger>
            <TabsTrigger
              value="responses"
              className="min-w-[120px] flex-grow text-sm sm:flex-1 sm:basis-0 sm:text-base"
            >
              View Responses
            </TabsTrigger>
            <TabsTrigger
              value="questions"
              className="min-w-[120px] flex-grow text-sm sm:flex-1 sm:basis-0 sm:text-base"
            >
              Q&A Questions {questions.length > 0 && `(${questions.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-6">
            <Card className="bg-slate-100 dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Presentation Control</CardTitle>
              </CardHeader>
              <CardContent>
                <PresenterControlSplit
                  eventShortId={event.shortId ?? ""}
                  onStateUpdate={handleStateUpdate}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <Card className="bg-slate-100 dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Activity Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityManagerSplit
                  eventId={eventId}
                  activities={activities}
                  onCreateActivity={handleCreateActivity}
                  onUpdateActivity={handleUpdateActivity}
                  onDeleteActivity={handleDeleteActivity}
                  onReorderActivities={handleReorderActivities}
                  onStartActivity={handleStartActivity}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responses" className="space-y-6">
            <Card className="bg-slate-100 dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Audience Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {activities.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No activities created yet.
                      <br />
                      Create activities in the &ldquo;Manage Activities&rdquo;
                      tab to see responses here.
                    </div>
                  ) : (
                    activities.map((activity) => (
                      <ActivityResponseCard
                        key={activity.id}
                        activity={activity}
                        onShowResults={handleShowResults}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            <Card className="bg-slate-100 dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Q&A Questions ({questions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No questions have been submitted yet.
                      <br />
                      Questions will appear here as your audience submits them.
                    </div>
                  ) : (
                    questions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        onAnswer={handleAnswerQuestion}
                        onDelete={handleDeleteQuestion}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
