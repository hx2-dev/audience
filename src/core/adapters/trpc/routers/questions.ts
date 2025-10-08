import { z } from "zod";
import * as E from "fp-ts/lib/Either";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/core/adapters/trpc/trpc";
import { createQuestionValidator } from "~/core/features/questions/types";
import { QuestionService } from "~/core/features/questions/service";
import { container } from "tsyringe";
import { toTrpcError } from "~/core/common/error";
import type { PublicQuestion, Question } from "~/core/features/questions/types";
import type { TaskEither } from "fp-ts/lib/TaskEither";

const serviceCall = async <T>(
  fn: (service: QuestionService) => TaskEither<Error, T>,
) => {
  const service = container.resolve<QuestionService>(QuestionService);
  const result = await fn(service)();

  return E.match(
    (error: Error) => {
      throw toTrpcError(error);
    },
    (data: T) => data,
  )(result);
};

export const questionsRouter = createTRPCRouter({
  getByEventId: publicProcedure
    .input(z.object({ eventId: z.uuid() }))
    .query<PublicQuestion[]>(({ input }) => {
      return serviceCall((service) => service.getByEventId(input.eventId));
    }),

  getByEventIdForPresenter: protectedProcedure
    .input(z.object({ eventId: z.uuid() }))
    .query<Question[]>(({ input }) => {
      return serviceCall((service) =>
        service.getByEventIdForPresenter(input.eventId),
      );
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .query<Question>(({ input }) => {
      return serviceCall((service) => service.getById(input.id));
    }),

  submit: protectedProcedure
    .input(createQuestionValidator)
    .mutation<PublicQuestion>(async ({ input, ctx }) => {
      return serviceCall((service) =>
        service.submit(
          input,
          ctx.session.user.id,
          ctx.session.user.name ?? undefined,
        ),
      );
    }),

  answer: protectedProcedure
    .input(
      z.object({
        questionId: z.number().int().min(1),
        answer: z.string().min(1),
      }),
    )
    .mutation<Question>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.answer(input.questionId, input.answer, ctx.session.user.id),
      );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .mutation<void>(({ ctx, input }) => {
      return serviceCall((service) =>
        service.delete(input.id, ctx.session.user.id),
      );
    }),
});
