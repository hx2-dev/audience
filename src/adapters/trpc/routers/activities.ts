import { z } from "zod";
import * as E from "fp-ts/lib/Either";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/adapters/trpc/trpc";
import {
  createActivityValidator,
  updateActivityValidator,
} from "~/core/features/activities/types";
import { ActivityService } from "~/core/features/activities/service";
import { container } from "tsyringe";
import { toTrpcError } from "~/core/common/error";
import type { Activity } from "~/core/features/activities/types";
import type { ActivityResult } from "~/core/features/activities/results";
import type { TaskEither } from "fp-ts/lib/TaskEither";

const serviceCall = async <T>(
  fn: (service: ActivityService) => TaskEither<Error, T>,
) => {
  const service = container.resolve<ActivityService>(ActivityService);
  const result = await fn(service)();

  return E.match(
    (error: Error) => {
      throw toTrpcError(error);
    },
    (data: T) => data,
  )(result);
};

export const activitiesRouter = createTRPCRouter({
  getByEventId: publicProcedure
    .input(z.object({ eventId: z.uuid() }))
    .query<Activity[]>(({ input }) => {
      return serviceCall((service) => service.getByEventId(input.eventId));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .query<Activity>(({ input }) => {
      return serviceCall((service) => service.getById(input.id));
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
    .mutation<void>(({ ctx, input }) => {
      return serviceCall((service) =>
        service.delete(input.id, ctx.session.user.id),
      );
    }),

  reorder: protectedProcedure
    .input(z.object({ activityIds: z.array(z.number().int().min(1)) }))
    .mutation<void>(({ ctx, input }) => {
      return serviceCall((service) =>
        service.reorder(input.activityIds, ctx.session.user.id),
      );
    }),

  getResults: protectedProcedure
    .input(z.object({ activityId: z.number().int().min(1) }))
    .query<ActivityResult>(({ ctx, input }) => {
      return serviceCall((service) =>
        service.getResults(input.activityId, ctx.session.user.id),
      );
    }),
});
