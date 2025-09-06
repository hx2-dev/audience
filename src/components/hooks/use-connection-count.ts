import { useEffect } from "react";
import { api } from "~/trpc/react";

export function useConnectionCount(shortId: string | undefined) {
  const connectionCountQuery = api.presenter.getConnectionCount.useQuery(
    { shortId: shortId ?? "" },
    { 
      enabled: !!shortId,
      refetchInterval: 10000, // Refresh every 10 seconds
      refetchIntervalInBackground: true,
    }
  );

  // Also refetch when connection events might happen
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && shortId) {
        void connectionCountQuery.refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [connectionCountQuery, shortId]);

  return {
    connectionCount: connectionCountQuery.data?.connectionCount ?? 0,
    isLoading: connectionCountQuery.isLoading,
    error: connectionCountQuery.error,
    refetch: connectionCountQuery.refetch,
  };
}