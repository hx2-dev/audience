import { z } from "zod";
import * as E from "fp-ts/lib/Either";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/adapters/trpc/trpc";
import { updatePresenterStateValidator } from "~/core/features/presenter/types";
import {
  type PresenterService,
  PresenterServiceSymbol,
} from "~/core/features/presenter/service";
import { container } from "tsyringe";
import { toTrpcError } from "~/core/common/error";
import type { PresenterState } from "~/core/features/presenter/types";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import type { ActivityResponse } from "~/core/features/responses/types";

const serviceCall = async <T>(
  fn: (service: PresenterService) => TaskEither<Error, T>,
) => {
  const service = container.resolve<PresenterService>(PresenterServiceSymbol);
  const result = await fn(service)();

  return E.match(
    (error: Error) => {
      throw toTrpcError(error);
    },
    (data: T) => data,
  )(result);
};

export const presenterRouter = createTRPCRouter({
  getByEventId: publicProcedure
    .input(z.object({ eventId: z.number().int().min(1) }))
    .query<PresenterState>(({ input }) => {
      return serviceCall((service) => service.getByEventId(input.eventId));
    }),

  getStateWithUserResponse: publicProcedure
    .input(
      z.object({
        eventId: z.number().int().min(1),
        userId: z.string().optional(),
      }),
    )
    .query<{
      presenterState: PresenterState;
      userResponse: ActivityResponse | null;
      allResponses: ActivityResponse[];
    }>(async ({ input }) => {
      const presenterState = await serviceCall((service) =>
        service.getByEventId(input.eventId),
      );

      let userResponse = null;
      if (
        input.userId &&
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

        const responseResult = await responseService.getUserResponse(
          input.userId,
          presenterState.data.activityId,
        )();
        if (responseResult._tag === "Right") {
          userResponse = responseResult.right;
        }
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

        const allResponsesResult = await responseService.getByActivityId(
          presenterState.data.activityId,
        )();
        if (allResponsesResult._tag === "Right") {
          allResponses = allResponsesResult.right;
        }
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
