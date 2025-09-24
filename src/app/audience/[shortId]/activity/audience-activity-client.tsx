"use client";

import { ActivityTab } from "~/components/features/audience/activity-tab";
import { AudienceTabsNavigation } from "~/components/features/audience/audience-tabs-navigation";
import { api } from "~/trpc/react";
import { useAudienceRealtime } from "~/components/providers/audience-realtime-provider";
import { useEvent } from "~/components/providers/event-provider";
import { useEffect, useRef } from "react";

export function AudienceActivityPageClient() {
  // Get event data from context
  const { event, shortId } = useEvent();
  const lastCombinedRefreshRef = useRef<number>(Date.now());
  const combinedPeriodicRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Get realtime data from unified provider
  const { questions, onPresenterStateUpdate } = useAudienceRealtime();

  // Get presenter state with user response data in one query
  const combinedDataQuery = api.presenter.getStateWithUserResponse.useQuery(
    {
      eventId: event?.id ?? 0,
    },
    { enabled: !!event?.id },
  );

  // Auto-refetch combined data when presenter state changes (for activity responses)
  useEffect(() => {
    const unsubscribe = onPresenterStateUpdate(() => {
      // Always refetch when presenter state changes, regardless of the new value
      // This ensures we get the latest state from the database
      void combinedDataQuery.refetch();
      lastCombinedRefreshRef.current = Date.now();
      window.dispatchEvent(new CustomEvent("activity-responses-updated"));
    });

    return unsubscribe;
  }, [onPresenterStateUpdate, combinedDataQuery]);

  // Setup periodic refresh for combined data
  useEffect(() => {
    if (!event?.id) return;

    const setupCombinedPeriodicRefresh = () => {
      const checkAndRefreshCombined = () => {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastCombinedRefreshRef.current;
        
        // If no combined data refresh for 45 seconds, refresh
        if (timeSinceLastRefresh > 45000) {
          void combinedDataQuery.refetch();
          lastCombinedRefreshRef.current = now;
        }
        
        combinedPeriodicRefreshRef.current = setTimeout(checkAndRefreshCombined, 15000); // Check every 15 seconds
      };
      
      combinedPeriodicRefreshRef.current = setTimeout(checkAndRefreshCombined, 15000);
    };

    // Handle visibility change for combined data
    const handleCombinedVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh combined data when tab becomes visible
        void combinedDataQuery.refetch();
        lastCombinedRefreshRef.current = Date.now();
      }
    };

    setupCombinedPeriodicRefresh();
    document.addEventListener("visibilitychange", handleCombinedVisibilityChange);

    return () => {
      if (combinedPeriodicRefreshRef.current) {
        clearTimeout(combinedPeriodicRefreshRef.current);
      }
      document.removeEventListener("visibilitychange", handleCombinedVisibilityChange);
    };
  }, [event?.id, combinedDataQuery]);

  // Dispatch custom event for navigation count updates
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("questions-updated", {
        detail: { questionsCount: questions.length },
      }),
    );
  }, [questions.length]);

  // Extract data for easier access
  const combinedData = combinedDataQuery.data;


  return (
    <div>
      <div className="space-y-6">

        <AudienceTabsNavigation
          shortId={shortId}
          currentPage="activity"
          questionsCount={questions.length}
        />

        {/* Activity Content - Use query data as source of truth */}
        {combinedData?.presenterState ? (
          <ActivityTab
            presenterState={combinedData.presenterState}
            userResponse={combinedData?.userResponse ?? null}
            allResponses={combinedData?.allResponses ?? []}
            refetchData={combinedDataQuery.refetch}
          />
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Waiting for presenter to start an activity...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
