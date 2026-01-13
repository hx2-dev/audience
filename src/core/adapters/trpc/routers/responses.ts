import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/core/adapters/trpc/trpc";
import {
  createActivityResponseValidator,
  updateActivityResponseValidator,
} from "~/core/features/responses/types";
import { ActivityResponseService } from "~/core/features/responses/service";
import { container } from "tsyringe";
import { toTrpcError } from "~/core/common/error";
import type {
  BaseActivityResponse,
  ActivityResponse,
} from "~/core/features/responses/types";

const serviceCall = async <T>(
  fn: (service: ActivityResponseService) => Promise<T>,
): Promise<T> => {
  const service = container.resolve<ActivityResponseService>(
    ActivityResponseService,
  );
  try {
    return await fn(service);
  } catch (error) {
    throw toTrpcError(error instanceof Error ? error : new Error(String(error)));
  }
};

export const responsesRouter = createTRPCRouter({
  getByActivityId: publicProcedure
    .input(z.object({ activityId: z.number().int().min(1) }))
    .query<ActivityResponse[]>(async ({ input }) => {
      return serviceCall((service) =>
        service.getByActivityId(input.activityId),
      );
    }),

  getUserResponse: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        activityId: z.number().int().min(1),
      }),
    )
    .query<ActivityResponse | null>(async ({ input }) => {
      return serviceCall((service) =>
        service.getUserResponse(input.userId, input.activityId),
      );
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
