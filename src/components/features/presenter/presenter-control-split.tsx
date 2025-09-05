"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { ActivityData } from "~/core/features/presenter/types";
import { TimerControl } from "./live-controls/timer-control";
import { MultipleChoiceControl } from "./live-controls/multiple-choice-control";
import { FreeResponseControl } from "./live-controls/free-response-control";
import { RankingControl } from "./live-controls/ranking-control";

interface PresenterControlProps {
  eventShortId: string;
  onStateUpdate: (page: string, data?: ActivityData) => Promise<void>;
}

export function PresenterControlSplit({ eventShortId, onStateUpdate }: PresenterControlProps) {
  const [currentPage, setCurrentPage] = useState("welcome");
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePageChange = async (newPage: string, data?: ActivityData) => {
    setIsUpdating(true);
    try {
      await onStateUpdate(newPage, data);
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Failed to update presenter state:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivityStart = async (data: ActivityData) => {
    await handlePageChange(data.type, data);
  };

  const audienceUrl = `${window.location.origin}/audience/${eventShortId}`;

  return (
    <div className="space-y-6">
      <Card className="bg-slate-100 dark:bg-slate-800">
        <CardHeader>
          <CardTitle>Event Control</CardTitle>
          <CardDescription>
            Control what your audience sees in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="audience-url">Audience URL</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="audience-url"
                value={audienceUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(audienceUrl)}
              >
                Copy
              </Button>
            </div>
          </div>
          
          <div>
            <Label>Event ID</Label>
            <Badge variant="outline" className="ml-2 font-mono text-lg">
              {eventShortId.toUpperCase()}
            </Badge>
          </div>
          
          <div>
            <Label>Current Page</Label>
            <Badge className="ml-2">{currentPage}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-100 dark:bg-slate-800">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant={currentPage === "welcome" ? "default" : "outline"}
            onClick={() => void handlePageChange("welcome", { type: "welcome" })}
            disabled={isUpdating}
          >
            Welcome
          </Button>
          <Button
            variant="outline"
            onClick={() => void handlePageChange("break", { type: "break" })}
            disabled={isUpdating}
          >
            Break
          </Button>
          <Button
            variant="outline"
            onClick={() => void handlePageChange("thank-you", { type: "thank-you" })}
            disabled={isUpdating}
          >
            Thank You
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="flex flex-wrap gap-1 w-full h-auto p-1">
          <TabsTrigger value="timer" className="flex-grow min-w-[120px] sm:flex-1 sm:basis-0">Timer</TabsTrigger>
          <TabsTrigger value="multiple-choice" className="flex-grow min-w-[120px] sm:flex-1 sm:basis-0">Multiple Choice</TabsTrigger>
          <TabsTrigger value="free-response" className="flex-grow min-w-[120px] sm:flex-1 sm:basis-0">Free Response</TabsTrigger>
          <TabsTrigger value="ranking" className="flex-grow min-w-[120px] sm:flex-1 sm:basis-0">Ranking</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timer" className="space-y-4">
          <TimerControl onStart={handleActivityStart} isUpdating={isUpdating} />
        </TabsContent>
        
        <TabsContent value="multiple-choice" className="space-y-4">
          <MultipleChoiceControl onStart={handleActivityStart} isUpdating={isUpdating} />
        </TabsContent>
        
        <TabsContent value="free-response" className="space-y-4">
          <FreeResponseControl onStart={handleActivityStart} isUpdating={isUpdating} />
        </TabsContent>
        
        <TabsContent value="ranking" className="space-y-4">
          <RankingControl onStart={handleActivityStart} isUpdating={isUpdating} />
        </TabsContent>
      </Tabs>
    </div>
  );
}