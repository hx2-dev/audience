import { z } from "zod";
import { activityDataValidator } from "~/core/features/presenter/types";
import { auditableSchema } from "~/core/generic/audit/auditable";

export const createActivityValidator = z.object({
  eventId: z.uuid(),
  name: z.string().min(1),
  type: z.string().min(1),
  data: activityDataValidator,
  order: z.number().int().min(0).default(0),
});

export type CreateActivity = z.infer<typeof createActivityValidator>;

export const activityValidator = z.object({
  ...createActivityValidator.shape,
  ...auditableSchema.shape,
  id: z.number().int().min(1),
});

export type Activity = z.infer<typeof activityValidator>;

export const updateActivityValidator = createActivityValidator
  .partial()
  .extend({
    id: z.number().int().min(1),
  });

export type UpdateActivity = z.infer<typeof updateActivityValidator>;
