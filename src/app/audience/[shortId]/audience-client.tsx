"use client";

import { useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Checkbox } from "~/components/ui/checkbox";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { MessageSquare, Send, LogIn, User } from "lucide-react";
import { api } from "~/trpc/react";
import type { Session } from "next-auth";
import { useEventSSE } from "~/components/hooks/use-event-sse";
import { WelcomeActivity } from "~/components/features/activities/welcome-activity";
import { TimerActivity } from "~/components/features/activities/timer-activity";
import { MultipleChoiceActivity } from "~/components/features/activities/multiple-choice-activity";
import { FreeResponseActivity } from "~/components/features/activities/free-response-activity";
import { RankingActivity } from "~/components/features/activities/ranking-activity";
import { BreakActivity } from "~/components/features/activities/break-activity";
import { ThankYouActivity } from "~/components/features/activities/thank-you-activity";

interface AudiencePageClientProps {
  shortId: string;
  session: Session;
}

export function AudiencePageClient({ shortId, session }: AudiencePageClientProps) {
  // Question submission state
  const [activeTab, setActiveTab] = useState("activity");
  const [questionText, setQuestionText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get event by shortId
  const { data: event } = api.event.getByShortId.useQuery(
    { shortId },
    { enabled: !!shortId },
  );

  // Get presenter state for this event
  const { data: presenterState, refetch: refetchPresenterState } =
    api.presenter.getByEventId.useQuery(
      { eventId: event?.id ?? 0 },
      { enabled: !!event?.id },
    );

  // Get questions for this event
  const { data: questions = [], refetch: refetchQuestions } =
    api.questions.getByEventId.useQuery(
      { eventId: event?.id ?? 0 },
      { enabled: !!event?.id },
    );

  // Question submission mutation
  const submitQuestionMutation = api.questions.submit.useMutation();

  // Stabilize SSE callbacks to prevent unnecessary reconnections
  const sseCallbacks = useCallback(() => ({
    onPresenterStateRefresh: () => void refetchPresenterState(),
    onQuestionsRefresh: () => void refetchQuestions(),
  }), [refetchPresenterState, refetchQuestions]);

  // SSE connection for real-time updates
  const { isConnected, error, usingPolling } = useEventSSE({
    shortId,
    callbacks: sseCallbacks(),
    enabled: !!shortId,
  });


  const handleSubmitQuestion = async () => {
    if (!questionText.trim() || !event?.id || isSubmitting || !session?.user) return;

    setIsSubmitting(true);
    try {
      await submitQuestionMutation.mutateAsync({
        eventId: event.id,
        question: questionText.trim(),
        isAnonymous,
      });
      
      // Reset form
      setQuestionText("");
      
      // Refresh questions (SSE should handle this automatically, but keep as backup)
      await refetchQuestions();
    } catch (error) {
      console.error("Failed to submit question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentPage = () => {
    if (!presenterState) {
      return (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          Waiting for presenter to start...
        </div>
      );
    }

    if (!presenterState.data) {
      return (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No activity data available
        </div>
      );
    }

    switch (presenterState.data.type) {
      case "welcome":
        return <WelcomeActivity data={presenterState.data} />;
      case "timer":
        return <TimerActivity data={presenterState.data} />;
      case "multiple-choice":
        return <MultipleChoiceActivity data={presenterState.data} />;
      case "free-response":
        return <FreeResponseActivity data={presenterState.data} />;
      case "ranking":
        return <RankingActivity data={presenterState.data} />;
      case "break":
        return <BreakActivity data={presenterState.data} />;
      case "thank-you":
        return <ThankYouActivity data={presenterState.data} />;
      default: {
        const unknownData = presenterState.data as { type: string };
        return (
          <div className="py-8">
            <Card>
              <CardContent className="pt-6">
                <h2 className="mb-4 text-xl font-semibold">
                  Unknown Activity: {unknownData.type}
                </h2>
                <pre className="overflow-auto rounded-lg bg-gray-100 p-4 text-sm dark:bg-gray-800">
                  {JSON.stringify(presenterState.data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        );
      }
    }
  };

  if (error && !isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold break-words sm:text-2xl lg:text-3xl">
            {event?.title ?? `Event: ${shortId.toUpperCase()}`}
          </h1>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className="shrink-0"
            >
              {isConnected
                ? usingPolling
                  ? "Connected (Polling)"
                  : "Connected"
                : "Connecting..."}
            </Badge>
            {session?.user && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {session.user.name}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => signOut()}
                  title="Sign out"
                >
                  <LogIn className="w-4 h-4 rotate-180" />
                </Button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activity" className="flex items-center gap-2">
              Activity
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Questions {questions.length > 0 && `(${questions.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity">
            <Card>
              <CardContent className="p-4 sm:p-6">
                {renderCurrentPage()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="questions" className="space-y-4">
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
                  <Send className="w-4 h-4 mr-2" />
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
                      <div className="text-xs text-gray-500 mt-1">
                        {question.isAnonymous ? "Anonymous" : (question.submitterName ?? "Unknown")} • {" "}
                        {question.createdAt.toLocaleTimeString()}
                        {question.isAnswered && question.answer && (
                          <span className="text-green-600 ml-2">✓ Answered</span>
                        )}
                      </div>
                      {question.isAnswered && question.answer && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                          <strong>Answer:</strong> {question.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {error && isConnected && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
            <p className="text-sm break-words text-yellow-800 dark:text-yellow-300">
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}