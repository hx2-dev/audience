import { z } from "zod";

// Response data validators for discriminated union
const multipleChoiceResponseDataValidator = z.object({
  activityType: z.literal("multiple-choice"),
  responses: z.array(z.string()).min(1), // Array of selected options
});

const rankingResponseDataValidator = z.object({
  activityType: z.literal("ranking"),
  responses: z.array(z.string()).min(1), // Array of items in ranked order
});

const freeResponseDataValidator = z.object({
  activityType: z.literal("free-response"),
  responses: z.string().min(1), // Single text response
});

const timerResponseDataValidator = z.object({
  activityType: z.literal("timer"),
  responses: z.string().optional(), // Optional response for timer activities
});

// Discriminated union for all activity response data types
const activityResponseDataValidator = z.discriminatedUnion("activityType", [
  multipleChoiceResponseDataValidator,
  rankingResponseDataValidator,
  freeResponseDataValidator,
  timerResponseDataValidator,
]);

export const createActivityResponseValidator = z.object({
  activityId: z.number().int().min(1),
  response: z.unknown(),
});

export type CreateActivityResponse = z.infer<
  typeof createActivityResponseValidator
>;

// Typed create activity response with discriminated union
export const typedCreateActivityResponseValidator = z.object({
  activityId: z.number().int().min(1),
  activityType: z.enum([
    "multiple-choice",
    "ranking",
    "free-response",
    "timer",
  ]),
  response: activityResponseDataValidator,
});

export type TypedCreateActivityResponse = z.infer<
  typeof typedCreateActivityResponseValidator
>;

// Base activity response without discriminated union (for legacy support)
export const baseActivityResponseValidator = z.object({
  id: z.number().int().min(1),
  activityId: z.number().int().min(1),
  userId: z.string().nullable(),
  response: z.unknown(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Main activity response with discriminated union for response data
export const activityResponseValidator = z.object({
  id: z.number().int().min(1),
  activityId: z.number().int().min(1),
  userId: z.string().nullable(),
  activityType: z.enum([
    "multiple-choice",
    "ranking",
    "free-response",
    "timer",
  ]),
  response: activityResponseDataValidator,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BaseActivityResponse = z.infer<
  typeof baseActivityResponseValidator
>;
export type ActivityResponse = z.infer<typeof activityResponseValidator>;

export const updateActivityResponseValidator = z.object({
  id: z.number().int().min(1),
  response: z.unknown(),
});

export type UpdateActivityResponse = z.infer<
  typeof updateActivityResponseValidator
>;
