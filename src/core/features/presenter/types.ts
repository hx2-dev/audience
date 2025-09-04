import { z } from "zod";

// Activity-specific data types
export const welcomeActivityValidator = z.object({
  type: z.literal("welcome"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
});

export const timerActivityValidator = z.object({
  type: z.literal("timer"),
  durationMs: z.number().int().positive(),
  startedAt: z.date(),
  title: z.string().optional(),
});

export const multipleChoiceQuestionValidator = z.object({
  type: z.literal("multiple-choice"),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  allowMultiple: z.boolean().default(false),
});

export const freeResponseQuestionValidator = z.object({
  type: z.literal("free-response"),
  question: z.string().min(1),
  placeholder: z.string().optional(),
  maxLength: z.number().int().positive().optional(),
});

export const rankingQuestionValidator = z.object({
  type: z.literal("ranking"),
  question: z.string().min(1),
  items: z.array(z.string().min(1)).min(2),
});

export const breakActivityValidator = z.object({
  type: z.literal("break"),
  message: z.string().optional(),
  duration: z.number().int().positive().optional(),
});

export const thankYouActivityValidator = z.object({
  type: z.literal("thank-you"),
  message: z.string().optional(),
});

export const iframeActivityValidator = z.object({
  type: z.literal("iframe"),
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
});

// Union of all activity types
export const activityDataValidator = z.discriminatedUnion("type", [
  welcomeActivityValidator,
  timerActivityValidator,
  multipleChoiceQuestionValidator,
  freeResponseQuestionValidator,
  rankingQuestionValidator,
  breakActivityValidator,
  thankYouActivityValidator,
  iframeActivityValidator,
]);

export type ActivityData = z.infer<typeof activityDataValidator>;

// For serialization (stored in database)
export const serializedPresenterStateValidator = z.object({
  eventId: z.number().int().min(1),
  currentPage: z.string().min(1),
  data: z.unknown(),
});

export type SerializedPresenterState = z.infer<
  typeof serializedPresenterStateValidator
>;

// Main presenter state type
export const presenterStateValidator = z.object({
  eventId: z.number().int().min(1),
  currentPage: z.string().min(1),
  data: activityDataValidator.optional(),
});

export type PresenterState = z.infer<typeof presenterStateValidator>;

export const updatePresenterStateValidator = z.object({
  eventId: z.number().int().min(1),
  currentPage: z.string().min(1),
  data: activityDataValidator.optional(),
});

export type UpdatePresenterState = z.infer<typeof updatePresenterStateValidator>;
