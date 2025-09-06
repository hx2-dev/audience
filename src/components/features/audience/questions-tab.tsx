"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Send } from "lucide-react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";

interface Question {
  id: number;
  question: string;
  submitterName: string | null;
  isAnonymous: boolean;
  isAnswered: boolean;
  answer: string | null;
  createdAt: Date;
}

interface QuestionsTabProps {
  eventId: string;
  questions: Question[];
  refetchQuestions: () => void;
}

export function QuestionsTab({
  eventId,
  questions,
  refetchQuestions,
}: QuestionsTabProps) {
  const { data: session } = useSession();
  const [questionText, setQuestionText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitQuestionMutation = api.questions.submit.useMutation();

  const handleSubmitQuestion = async () => {
    if (!questionText.trim() || !eventId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitQuestionMutation.mutateAsync({
        eventId: eventId,
        question: questionText.trim(),
        isAnonymous,
      });

      // Reset form
      setQuestionText("");

      // Refresh questions (SSE should handle this automatically, but keep as backup)
      void refetchQuestions();
    } catch (error) {
      console.error("Failed to submit question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Question</label>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="What would you like to ask?"
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <label htmlFor="anonymous" className="text-sm font-medium">
              Submit anonymously
            </label>
          </div>

          {!isAnonymous && session?.user?.name && (
            <div className="text-xs text-gray-500">
              Will show as: {session.user.name}
            </div>
          )}

          <Button
            onClick={handleSubmitQuestion}
            disabled={!questionText.trim() || isSubmitting}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit Question"}
          </Button>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Questions ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.map((question) => (
              <div key={question.id} className="border-b pb-3 last:border-b-0">
                <p className="text-sm font-medium">{question.question}</p>
                <div className="mt-1 text-xs text-gray-500">
                  {question.isAnonymous
                    ? "Anonymous"
                    : (question.submitterName ?? "Unknown")}{" "}
                  • {question.createdAt.toLocaleTimeString()}
                  {question.isAnswered && question.answer && (
                    <span className="ml-2 text-green-600">✓ Answered</span>
                  )}
                </div>
                {question.isAnswered && question.answer && (
                  <div className="mt-2 rounded bg-green-50 p-2 text-sm dark:bg-green-900/20">
                    <strong>Answer:</strong> {question.answer}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
