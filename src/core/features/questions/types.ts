import { z } from "zod";

export const createQuestionValidator = z.object({
  eventId: z.uuid(),
  question: z.string().min(1),
  isAnonymous: z.boolean().default(false),
});

export type CreateQuestion = z.infer<typeof createQuestionValidator>;

export const questionValidator = z.object({
  id: z.number().int().min(1),
  eventId: z.uuid(),
  question: z.string().min(1),
  submitterName: z.string().nullable(),
  submitterUserId: z.string().nullable(),
  isAnonymous: z.boolean(),
  isAnswered: z.boolean(),
  answer: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string().nullable(),
  deleted: z.date().nullable(),
});

export type Question = z.infer<typeof questionValidator>;

export const publicQuestionValidator = questionValidator.omit({
  submitterUserId: true,
  updatedBy: true,
});

export type PublicQuestion = z.infer<typeof publicQuestionValidator>;

export const updateQuestionValidator = z.object({
  isAnswered: z.boolean().optional(),
  answer: z.string().optional(),
});

export type UpdateQuestion = z.infer<typeof updateQuestionValidator>;

// Validator for database row format (dates as strings)
export const questionRowValidator = z.object({
  id: z.number().int(),
  eventId: z.string().uuid(),
  question: z.string(),
  submitterName: z.string().nullable(),
  submitterUserId: z.string().nullable(),
  isAnonymous: z.boolean(),
  isAnswered: z.boolean(),
  answer: z.string().nullable(),
  createdAt: z.string(), // ISO string from database
  updatedAt: z.string(), // ISO string from database
  updatedBy: z.string(),
  deleted: z.string().nullable(), // ISO string from database or null
});

export type QuestionRow = z.infer<typeof questionRowValidator>;
