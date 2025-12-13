import z from "zod";

export const auditableSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string(),
  deleted: z.date().nullable(),
});

export type Auditable = z.infer<typeof auditableSchema>;
