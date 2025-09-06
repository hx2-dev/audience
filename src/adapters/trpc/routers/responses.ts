import { z } from "zod";
import * as E from "fp-ts/lib/Either";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/adapters/trpc/trpc";
import {
  createActivityResponseValidator,
  updateActivityResponseValidator,
} from "~/core/features/responses/types";
import { ActivityResponseService } from "~/core/features/responses/service";
import { container } from "tsyringe";
import { toTrpcError } from "~/core/common/error";
import type { BaseActivityResponse, ActivityResponse } from "~/core/features/responses/types";
import type { TaskEither } from "fp-ts/lib/TaskEither";

const serviceCall = async <T>(
  fn: (service: ActivityResponseService) => TaskEither<Error, T>,
) => {
  const service = container.resolve<ActivityResponseService>(ActivityResponseService);
  const result = await fn(service)();

  return E.match(
    (error: Error) => {
      throw toTrpcError(error);
    },
    (data: T) => data,
  )(result);
};

export const responsesRouter = createTRPCRouter({
  getByActivityId: publicProcedure
    .input(z.object({ activityId: z.number().int().min(1) }))
    .query<ActivityResponse[]>(({ input }) => {
      return serviceCall((service) => service.getByActivityId(input.activityId));
    }),

  getUserResponse: publicProcedure
    .input(z.object({ 
      userId: z.string(),
      activityId: z.number().int().min(1) 
    }))
    .query<ActivityResponse | null>(({ input }) => {
      return serviceCall((service) => service.getUserResponse(input.userId, input.activityId));
    }),

  submit: protectedProcedure
    .input(createActivityResponseValidator)
    .mutation<BaseActivityResponse>(async ({ input, ctx }) => {
      return serviceCall((service) =>
        service.submitResponse(input, ctx.session.user.id),
      );
    }),

  update: protectedProcedure
    .input(updateActivityResponseValidator)
    .mutation<BaseActivityResponse>(async ({ input, ctx }) => {
      return serviceCall((service) =>
        service.updateResponse(input, ctx.session.user.id),
      );
    }),
});