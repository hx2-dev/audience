import { z } from "zod";

// Base activity response data validator
export const baseActivityResponseValidator = z.object({
  activityType: z.string(),
});

// Multiple Choice Response Data
export const multipleChoiceResponseDataValidator = z.object({
  activityType: z.literal("multiple-choice"),
  responses: z.array(z.string()).min(1), // Array of selected options
});

// Ranking Response Data
export const rankingResponseDataValidator = z.object({
  activityType: z.literal("ranking"),
  responses: z.array(z.string()).min(1), // Array of items in ranked order
});

// Free Response Data
export const freeResponseDataValidator = z.object({
  activityType: z.literal("free-response"),
  responses: z.string().min(1), // Single text response
});

// Timer Response Data (if user clicks something during timer)
export const timerResponseDataValidator = z.object({
  activityType: z.literal("timer"),
  responses: z.string().optional(), // Optional response for timer activities
});

// Discriminated union for all activity response data types
export const activityResponseDataValidator = z.discriminatedUnion(
  "activityType",
  [
    multipleChoiceResponseDataValidator,
    rankingResponseDataValidator,
    freeResponseDataValidator,
    timerResponseDataValidator,
  ],
);

export type ActivityResponseData = z.infer<
  typeof activityResponseDataValidator
>;
export type MultipleChoiceResponseData = z.infer<
  typeof multipleChoiceResponseDataValidator
>;
export type RankingResponseData = z.infer<typeof rankingResponseDataValidator>;
export type FreeResponseData = z.infer<typeof freeResponseDataValidator>;

// Helper function to safely parse and extract user responses
export function extractUserResponse(
  activityType: string,
  responseData: unknown,
):
  | { success: true; data: string[] }
  | { success: true; data: string }
  | { success: false; error: string } {
  try {
    const parsed = activityResponseDataValidator.parse({
      activityType,
      responses: responseData,
    });

    switch (parsed.activityType) {
      case "multiple-choice":
      case "ranking":
        return { success: true, data: parsed.responses };
      case "free-response":
        return { success: true, data: parsed.responses };
      case "timer":
        return { success: true, data: parsed.responses ?? "" };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof z.ZodError ? error.message : "Invalid response data",
    };
  }
}

// Simplified extractors for specific types
export function extractMultipleChoiceResponse(responseData: unknown): string[] {
  const result = multipleChoiceResponseDataValidator.safeParse({
    activityType: "multiple-choice",
    responses: responseData,
  });

  return result.success ? result.data.responses : [];
}

export function extractRankingResponse(responseData: unknown): string[] {
  const result = rankingResponseDataValidator.safeParse({
    activityType: "ranking",
    responses: responseData,
  });

  return result.success ? result.data.responses : [];
}

export function extractFreeResponse(responseData: unknown): string {
  const result = freeResponseDataValidator.safeParse({
    activityType: "free-response",
    responses: responseData,
  });

  return result.success ? result.data.responses : "";
}
