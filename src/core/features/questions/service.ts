import { inject, singleton } from "tsyringe";
import { QuestionQueries } from "./adapters/queries";
import { EventService } from "~/core/features/events/service";
import { ForbiddenError, NotFoundError } from "~/core/common/error";
import type {
  CreateQuestion,
  PublicQuestion,
  Question,
} from "~/core/features/questions/types";
import type { Event } from "~/core/features/events/types";

@singleton()
export class QuestionService {
  constructor(
    @inject(QuestionQueries)
    private readonly questionQueries: QuestionQueries,
    @inject(EventService)
    private readonly eventService: EventService,
  ) {}

  async getByEventId(eventId: string): Promise<PublicQuestion[]> {
    const questions = await this.questionQueries.getByEventId({ eventId });
    return questions.map((q) => this.toPublicQuestion(q));
  }

  async getByEventIdForPresenter(eventId: string): Promise<Question[]> {
    return this.questionQueries.getByEventId({ eventId });
  }

  private toPublicQuestion = (question: Question): PublicQuestion => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- peeling off the submitterUserId is intentional
    const { submitterUserId, ...publicQuestion } = question;
    return publicQuestion;
  };

  async getById(id: number): Promise<Question | null> {
    return this.questionQueries.getById({ id });
  }

  async submit(
    createQuestion: CreateQuestion,
    userId: string,
    userName?: string,
  ): Promise<PublicQuestion> {
    const event = await this.eventService.getById(createQuestion.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    const question = await this.questionQueries.create({
      createQuestion,
      userId,
      userName,
    });
    return this.toPublicQuestion(question);
  }

  async answer(
    questionId: number,
    answer: string,
    userId: string,
  ): Promise<Question> {
    const question = await this.getById(questionId);
    if (!question) {
      throw new NotFoundError("Question not found");
    }
    const event = await this.eventService.getById(question.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    const updated = await this.questionQueries.update({
      questionId,
      updateQuestion: { isAnswered: true, answer },
      userId,
    });
    if (!updated) {
      throw new NotFoundError("Question not updated");
    }
    return updated;
  }

  async delete(questionId: number, userId: string): Promise<void> {
    const question = await this.getById(questionId);
    if (!question) {
      throw new NotFoundError("Question not found");
    }
    const event = await this.eventService.getById(question.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    await this.questionQueries.delete({ questionId, userId });
  }

  private checkEventAuthorization(event: Event, userId: string): void {
    if (event.creatorId !== userId) {
      throw new ForbiddenError(
        `User ${userId} is not authorized to manage questions for event ${event.id}`,
      );
    }
  }
}
