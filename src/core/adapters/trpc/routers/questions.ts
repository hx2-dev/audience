import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/core/adapters/trpc/trpc";
import { createQuestionValidator } from "~/core/features/questions/types";
import { QuestionService } from "~/core/features/questions/service";
import { container } from "tsyringe";
import { toTrpcError, NotFoundError } from "~/core/common/error";
import type { PublicQuestion, Question } from "~/core/features/questions/types";

const serviceCall = async <T>(
  fn: (service: QuestionService) => Promise<T>,
): Promise<T> => {
  const service = container.resolve<QuestionService>(QuestionService);
  try {
    return await fn(service);
  } catch (error) {
    throw toTrpcError(error instanceof Error ? error : new Error(String(error)));
  }
};

export const questionsRouter = createTRPCRouter({
  getByEventId: publicProcedure
    .input(z.object({ eventId: z.uuid() }))
    .query<PublicQuestion[]>(async ({ input }) => {
      return serviceCall((service) => service.getByEventId(input.eventId));
    }),

  getByEventIdForPresenter: protectedProcedure
    .input(z.object({ eventId: z.uuid() }))
    .query<Question[]>(async ({ input }) => {
      return serviceCall((service) =>
        service.getByEventIdForPresenter(input.eventId),
      );
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .query<Question>(async ({ input }) => {
      const result = await serviceCall((service) => service.getById(input.id));
      if (!result) {
        throw toTrpcError(new NotFoundError("Question not found"));
      }
      return result;
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
    .mutation<void>(async ({ ctx, input }) => {
      return serviceCall((service) =>
        service.delete(input.id, ctx.session.user.id),
      );
    }),
});
