import { z } from "zod";

// Base result interface
export interface BaseActivityResult {
  activityId: number;
  totalResponses: number;
  activityType: string;
}

// Multiple Choice Results
export interface MultipleChoiceOption {
  value: string;
  label: string;
  count: number;
  percentage: number;
}

export const multipleChoiceResultValidator = z.object({
  activityId: z.number(),
  totalResponses: z.number(),
  activityType: z.literal("multiple-choice"),
  question: z.string(),
  allowMultiple: z.boolean(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
});

export type MultipleChoiceResult = z.infer<typeof multipleChoiceResultValidator>;

// Ranking Results
export interface RankingItem {
  item: string;
  averagePosition: number;
  voteCount: number;
  score: number;
}

export const rankingResultValidator = z.object({
  activityId: z.number(),
  totalResponses: z.number(),
  activityType: z.literal("ranking"),
  question: z.string(),
  items: z.array(z.object({
    item: z.string(),
    averagePosition: z.number(),
    voteCount: z.number(),
    score: z.number(),
  })),
});

export type RankingResult = z.infer<typeof rankingResultValidator>;

// Free Response Results
export interface ResponseItem {
  text: string;
  count: number;
  percentage: number;
}

export const freeResponseResultValidator = z.object({
  activityId: z.number(),
  totalResponses: z.number(),
  activityType: z.literal("free-response"),
  question: z.string(),
  responses: z.array(z.object({
    text: z.string(),
    count: z.number(),
    percentage: z.number(),
  })),
});

export type FreeResponseResult = z.infer<typeof freeResponseResultValidator>;

// Union type for all result types
export const activityResultValidator = z.discriminatedUnion("activityType", [
  multipleChoiceResultValidator,
  rankingResultValidator,
  freeResponseResultValidator,
]);

export type ActivityResult = z.infer<typeof activityResultValidator>;