import { z } from "zod";
import { auditableSchema } from "~/core/generic/audit/auditable";

export const createEventValidator = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start: z.date(),
  end: z.date(),
});

export type CreateEvent = z.infer<typeof createEventValidator>;

export const eventValidator = z.object({
  ...createEventValidator.shape,
  ...auditableSchema.shape,
  id: z.number().int().min(1),
  shortId: z.string().optional(),
  creatorId: z.string().min(1),
});

export type Event = z.infer<typeof eventValidator>;

export const updateEventValidator = createEventValidator.partial();

export type UpdateEvent = z.infer<typeof updateEventValidator>;
