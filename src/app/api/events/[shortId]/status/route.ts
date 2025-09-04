import type { NextRequest } from "next/server";

// Import the connections from the stream route
// We'll create a simple status endpoint to check SSE health

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> },
) {
  const { shortId } = await params;
  
  // Since we can't directly import the connections map, we'll provide basic info
  return Response.json({
    shortId,
    timestamp: new Date().toISOString(),
    message: "SSE status endpoint - check server logs for detailed connection info"
  });
}