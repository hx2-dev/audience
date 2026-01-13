import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/core/adapters/trpc/trpc";
import {
  createActivityValidator,
  updateActivityValidator,
} from "~/core/features/activities/types";
import { ActivityService } from "~/core/features/activities/service";
import { container } from "tsyringe";
import { toTrpcError, NotFoundError } from "~/core/common/error";
import type { Activity } from "~/core/features/activities/types";
import type { ActivityResult } from "~/core/features/activities/results";

const serviceCall = async <T>(
  fn: (service: ActivityService) => Promise<T>,
): Promise<T> => {
  const service = container.resolve<ActivityService>(ActivityService);
  try {
    return await fn(service);
  } catch (error) {
    throw toTrpcError(error instanceof Error ? error : new Error(String(error)));
  }
};

export const activitiesRouter = createTRPCRouter({
  getByEventId: publicProcedure
    .input(z.object({ eventId: z.uuid() }))
    .query<Activity[]>(async ({ input }) => {
      return serviceCall((service) => service.getByEventId(input.eventId));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .query<Activity>(async ({ input }) => {
      const result = await serviceCall((service) => service.getById(input.id));
      if (!result) {
        throw toTrpcError(new NotFoundError("Activity not found"));
      }
      return result;
    }),

  create: protectedProcedure
    .input(createActivityValidator)
    .mutation<Activity>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.create(input, ctx.session.user.id),
      );
    }),

  update: protectedProcedure
    .input(updateActivityValidator)
    .mutation<Activity>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.update(input.id, input, ctx.session.user.id),
      );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .mutation<void>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.delete(input.id, ctx.session.user.id),
      );
    }),

  reorder: protectedProcedure
    .input(z.object({ activityIds: z.array(z.number().int().min(1)) }))
    .mutation<void>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.reorder(input.activityIds, ctx.session.user.id),
      );
    }),

  getResults: protectedProcedure
    .input(z.object({ activityId: z.number().int().min(1) }))
    .query<ActivityResult>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.getResults(input.activityId, ctx.session.user.id),
      );
    }),
});
