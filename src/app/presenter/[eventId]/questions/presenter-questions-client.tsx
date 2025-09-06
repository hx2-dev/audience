"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { CheckCircle, Clock, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import { useQuestionsSSE } from "~/components/hooks/use-sse-query";
import type { Question } from "~/core/features/questions/types";
import { PresenterTabsNavigation } from "~/components/features/presenter/presenter-tabs-navigation";
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

export function PresenterQuestionsPageClient() {
  // Get event data from context
  const { event, eventId } = usePresenterEvent();

  // Fetch questions for this event
  const questionsQuery = api.questions.getByEventIdForPresenter.useQuery(
    { eventId },
    { enabled: !!eventId },
  );

  // SSE connection with automatic query integration
  const {} = useQuestionsSSE(
    questionsQuery,
    event?.shortId,
    !!event?.shortId,
  );

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


  return (
    <div>
      <div className="mx-auto max-w-7xl">

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
