import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/core/adapters/trpc/trpc";
import { updatePresenterStateValidator } from "~/core/features/presenter/types";
import {
  type PresenterService,
  PresenterServiceSymbol,
} from "~/core/features/presenter/service";
import { container } from "tsyringe";
import { toTrpcError } from "~/core/common/error";
import type { PresenterState } from "~/core/features/presenter/types";
import type { ActivityResponse } from "~/core/features/responses/types";

const serviceCall = async <T>(
  fn: (service: PresenterService) => Promise<T>,
): Promise<T> => {
  const service = container.resolve<PresenterService>(PresenterServiceSymbol);
  try {
    return await fn(service);
  } catch (error) {
    throw toTrpcError(error instanceof Error ? error : new Error(String(error)));
  }
};

export const presenterRouter = createTRPCRouter({
  getByEventId: publicProcedure
    .input(z.object({ eventId: z.uuid() }))
    .query<PresenterState | null>(async ({ input }) => {
      const service = container.resolve<PresenterService>(
        PresenterServiceSymbol,
      );
      return service.getByEventId(input.eventId);
    }),

  getStateWithUserResponse: protectedProcedure
    .input(
      z.object({
        eventId: z.uuid(),
      }),
    )
    .query<{
      presenterState: PresenterState | null;
      userResponse: ActivityResponse | null;
      allResponses: ActivityResponse[];
    }>(async ({ ctx, input }) => {
      const service = container.resolve<PresenterService>(
        PresenterServiceSymbol,
      );
      const presenterState = await service.getByEventId(input.eventId);

      if (!presenterState) {
        return {
          presenterState: null,
          userResponse: null,
          allResponses: [],
        };
      }

      let userResponse: ActivityResponse | null = null;
      if (
        presenterState.data?.type &&
        "activityId" in presenterState.data &&
        ["multiple-choice", "free-response", "ranking"].includes(
          presenterState.data.type,
        ) &&
        presenterState.data.activityId
      ) {
        const { container } = await import("tsyringe");
        const { ActivityResponseService } = await import(
          "~/core/features/responses/service"
        );
        const responseService = container.resolve(ActivityResponseService);

        userResponse = await responseService.getUserResponse(
          ctx.session.user.id,
          presenterState.data.activityId,
        );
      }

      let allResponses: ActivityResponse[] = [];
      if (
        presenterState.data &&
        "activityId" in presenterState.data &&
        presenterState.data?.activityId &&
        ["multiple-choice", "free-response", "ranking"].includes(
          presenterState.data.type,
        )
      ) {
        const { container } = await import("tsyringe");
        const { ActivityResponseService } = await import(
          "~/core/features/responses/service"
        );
        const responseService = container.resolve(ActivityResponseService);

        allResponses = await responseService.getByActivityId(
          presenterState.data.activityId,
        );
      }

      return {
        presenterState,
        userResponse,
        allResponses,
      };
    }),

  updateState: protectedProcedure
    .input(updatePresenterStateValidator)
    .mutation<PresenterState>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.updateState(input, ctx.session.user.id),
      );
    }),
});
