import { z } from "zod";

export const createActivityResponseValidator = z.object({
  activityId: z.number().int().min(1),
  response: z.unknown(),
});

export type CreateActivityResponse = z.infer<typeof createActivityResponseValidator>;

export const activityResponseValidator = z.object({
  id: z.number().int().min(1),
  activityId: z.number().int().min(1),
  userId: z.string().nullable(),
  response: z.unknown(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ActivityResponse = z.infer<typeof activityResponseValidator>;

export const updateActivityResponseValidator = z.object({
  id: z.number().int().min(1),
  response: z.unknown(),
});

export type UpdateActivityResponse = z.infer<typeof updateActivityResponseValidator>;