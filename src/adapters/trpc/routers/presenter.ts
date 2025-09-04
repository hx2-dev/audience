import { z } from "zod";
import * as E from "fp-ts/lib/Either";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/adapters/trpc/trpc";
import {
  updatePresenterStateValidator,
} from "~/core/features/presenter/types";
import {
  type PresenterService,
  PresenterServiceSymbol,
} from "~/core/features/presenter/service";
import { container } from "tsyringe";
import { toTrpcError } from "~/core/common/error";
import type { PresenterState } from "~/core/features/presenter/types";
import type { TaskEither } from "fp-ts/lib/TaskEither";

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

  updateState: protectedProcedure
    .input(updatePresenterStateValidator)
    .mutation<PresenterState>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.updateState(input, ctx.session.user.id),
      );
    }),
});