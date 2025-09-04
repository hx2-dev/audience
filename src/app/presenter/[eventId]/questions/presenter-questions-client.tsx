"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Trash2, CheckCircle, Clock, User, LogIn } from "lucide-react";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { api } from "~/trpc/react";
import type { Session } from "next-auth";
import { useQuestionsSSE } from "~/components/hooks/use-sse-query";
import type { Question } from "~/core/features/questions/types";
import { PresenterTabsNavigation } from "~/components/features/presenter/presenter-tabs-navigation";

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
    <div className="space-y-3 rounded-lg border p-4">
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

interface PresenterQuestionsPageClientProps {
  eventId: number;
  session: Session;
}

export function PresenterQuestionsPageClient({
  eventId,
  session,
}: PresenterQuestionsPageClientProps) {
  // Fetch event data
  const { data: event, isLoading: eventLoading } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: !isNaN(eventId) },
  );

  // Fetch questions for this event
  const questionsQuery = api.questions.getByEventIdForPresenter.useQuery(
    { eventId },
    { enabled: !isNaN(eventId) },
  );

  // SSE connection with automatic query integration
  const { isConnected } = useQuestionsSSE(questionsQuery, event?.shortId, !!event?.shortId);

  // Extract data for easier access
  const questions = questionsQuery.data ?? [];

  // Mutations
  const answerQuestionMutation = api.questions.answer.useMutation();
  const deleteQuestionMutation = api.questions.delete.useMutation();

  const handleAnswerQuestion = async (questionId: number, answer: string) => {
    await answerQuestionMutation.mutateAsync({ questionId, answer });
    await questionsQuery.refetch();
  };

  const handleDeleteQuestion = async (questionId: number) => {
    await deleteQuestionMutation.mutateAsync({ id: questionId });
    await questionsQuery.refetch();
  };

  if (eventLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Loading event...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Event not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold break-words text-gray-900 sm:text-3xl dark:text-gray-100">
                {event.title} - Q&A Questions
              </h1>
              {event.description && (
                <p className="mt-1 text-sm break-words text-gray-600 sm:text-base dark:text-gray-300">
                  {event.description}
                </p>
              )}
            </div>
            <div className="lg:shrink-0 lg:text-right">
              <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row lg:flex-col lg:items-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Event ID:
                  </span>
                  <Badge
                    variant={isConnected ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {isConnected ? "Connected" : "Connecting..."}
                  </Badge>
                  {session?.user && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <User className="h-3 w-3" />
                        {session.user.name}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut()}
                        title="Sign out"
                      >
                        <LogIn className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  )}
                  <ThemeToggle />
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-base sm:text-lg"
                >
                  {event.shortId ?? "No ID"}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                Share this ID with your audience
              </p>
            </div>
          </div>
        </div>

        <PresenterTabsNavigation eventId={eventId} currentPage="questions" />

        <div className="space-y-6">
          <Card>
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
        </div>
      </div>
    </div>
  );
}