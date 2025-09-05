import { z } from "zod";
import * as E from "fp-ts/lib/Either";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/adapters/trpc/trpc";
import {
  createEventValidator,
  updateEventValidator,
} from "~/core/features/events/types";
import { EventService } from "~/core/features/events/service";
import { container } from "tsyringe";
import { toTrpcError } from "~/core/common/error";
import type { Event } from "~/core/features/events/types";
import type { TaskEither } from "fp-ts/lib/TaskEither";

const serviceCall = async <T>(
  fn: (service: EventService) => TaskEither<Error, T>,
) => {
  const service = container.resolve<EventService>(EventService);
  const result = await fn(service)();

  return E.match(
    (error: Error) => {
      throw toTrpcError(error);
    },
    (data: T) => data,
  )(result);
};

export const eventRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.uuid() }))
    .query<Event>(({ input }) => {
      return serviceCall((service) => service.getById(input.id));
    }),

  getByShortId: publicProcedure
    .input(z.object({ shortId: z.string().length(6) }))
    .query<Event>(({ input }) => {
      return serviceCall((service) => service.getByShortId(input.shortId));
    }),

  create: protectedProcedure
    .input(createEventValidator)
    .mutation<Event>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.create(input, ctx.session.user.id),
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        event: updateEventValidator,
      }),
    )
    .mutation<Event>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.update(input.id, input.event, ctx.session.user.id),
      );
    }),

  generateShortId: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation<string>(({ ctx, input }) => {
      return serviceCall((service) =>
        service.generateShortId(input.id, ctx.session.user.id),
      );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation<void>(({ ctx, input }) => {
      return serviceCall((service) =>
        service.delete(input.id, ctx.session.user.id),
      );
    }),
});
