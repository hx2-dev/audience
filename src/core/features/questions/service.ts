import { inject, singleton } from "tsyringe";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { QuestionQueries } from "~/core/features/questions/queries";
import { EventService } from "~/core/features/events/service";
import { ForbiddenError } from "~/core/common/error";
import type {
  Question,
  CreateQuestion,
  PublicQuestion,
} from "~/core/features/questions/types";
import type { Event } from "~/core/features/events/types";
import { pipe } from "fp-ts/lib/function";

@singleton()
export class QuestionService {
  constructor(
    @inject(QuestionQueries)
    private readonly questionQueries: QuestionQueries,
    @inject(EventService)
    private readonly eventService: EventService,
  ) {}

  getByEventId(eventId: number): TaskEither<Error, PublicQuestion[]> {
    return pipe(
      this.questionQueries.getByEventId({ eventId }),
      TE.map((questions) => questions.map((q) => this.toPublicQuestion(q))),
    );
  }

  getByEventIdForPresenter(eventId: number): TaskEither<Error, Question[]> {
    return this.questionQueries.getByEventId({ eventId });
  }

  private toPublicQuestion = (question: Question): PublicQuestion => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { submitterUserId, ...publicQuestion } = question;
    return publicQuestion;
  };

  getById(id: number): TaskEither<Error, Question> {
    return this.questionQueries.getById({ id });
  }

  submit(
    createQuestion: CreateQuestion,
    userId: string,
    userName?: string,
  ): TaskEither<Error, PublicQuestion> {
    return pipe(
      this.eventService.getById(createQuestion.eventId),
      TE.flatMap((event) =>
        pipe(
          this.questionQueries.create({ createQuestion, userId, userName }),
          TE.map((q) => this.toPublicQuestion(q)),
          TE.tap(() =>
            event.shortId
              ? this.broadcastQuestionChange(event.shortId)
              : TE.of(undefined),
          ),
        ),
      ),
    );
  }

  answer(
    questionId: number,
    answer: string,
    userId: string,
  ): TaskEither<Error, Question> {
    return pipe(
      this.getById(questionId),
      TE.flatMap((question) =>
        pipe(
          this.eventService.getById(question.eventId),
          TE.flatMap(this.checkEventAuthorization(userId)),
          TE.map((event) => ({ question, event })),
        ),
      ),
      TE.flatMap(({ event }) =>
        pipe(
          this.questionQueries.update({
            questionId,
            updateQuestion: { isAnswered: true, answer },
            userId,
          }),
          TE.tap(() =>
            event.shortId
              ? this.broadcastQuestionChange(event.shortId)
              : TE.of(undefined),
          ),
        ),
      ),
    );
  }

  delete(questionId: number, userId: string): TaskEither<Error, void> {
    return pipe(
      this.getById(questionId),
      TE.flatMap((question) =>
        pipe(
          this.eventService.getById(question.eventId),
          TE.flatMap(this.checkEventAuthorization(userId)),
          TE.map((event) => ({ question, event })),
        ),
      ),
      TE.flatMap(({ event }) =>
        pipe(
          this.questionQueries.delete({ questionId, userId }),
          TE.tap(() =>
            event.shortId
              ? this.broadcastQuestionChange(event.shortId)
              : TE.of(undefined),
          ),
        ),
      ),
    );
  }

  private checkEventAuthorization(userId: string) {
    return TE.fromPredicate(
      (event: Event) => event.creatorId === userId,
      (event: Event) =>
        new ForbiddenError(
          `User ${userId} is not authorized to manage questions for event ${event.id}`,
        ),
    );
  }

  private broadcastQuestionChange(shortId: string) {
    return TE.tryCatch(
      async () => {
        const { broadcastToEvent } = await import(
          "~/app/api/events/[shortId]/stream/route"
        );
        broadcastToEvent(shortId, ["questions"]);
      },
      (error) => error as Error,
    );
  }
}
