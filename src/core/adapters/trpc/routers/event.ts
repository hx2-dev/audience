import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/core/adapters/trpc/trpc";
import {
  createEventValidator,
  updateEventValidator,
} from "~/core/features/events/types";
import { EventService } from "~/core/features/events/service";
import { container } from "tsyringe";
import { toTrpcError, NotFoundError } from "~/core/common/error";
import type { Event } from "~/core/features/events/types";

const serviceCall = async <T>(
  fn: (service: EventService) => Promise<T>,
): Promise<T> => {
  const service = container.resolve<EventService>(EventService);
  try {
    return await fn(service);
  } catch (error) {
    throw toTrpcError(error instanceof Error ? error : new Error(String(error)));
  }
};

export const eventRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.uuid() }))
    .query<Event>(async ({ input }) => {
      const result = await serviceCall((service) => service.getById(input.id));
      if (!result) {
        throw toTrpcError(new NotFoundError("Event not found"));
      }
      return result;
    }),

  getByShortId: publicProcedure
    .input(z.object({ shortId: z.string().length(6) }))
    .query<Event>(async ({ input }) => {
      const result = await serviceCall((service) =>
        service.getByShortId(input.shortId),
      );
      if (!result) {
        throw toTrpcError(new NotFoundError("Event not found"));
      }
      return result;
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
    .mutation<string>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.generateShortId(input.id, ctx.session.user.id),
      );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation<void>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.delete(input.id, ctx.session.user.id),
      );
    }),
});
