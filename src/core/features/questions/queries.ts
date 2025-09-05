import { and, eq, isNull } from "drizzle-orm";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { type SchemaConnection, db } from "~/adapters/db";
import { questions } from "~/adapters/db/schema";
import { singleton } from "tsyringe";
import type {
  CreateQuestion,
  Question,
  UpdateQuestion,
} from "~/core/features/questions/types";
import { NotFoundError } from "~/core/common/error";

@singleton()
export class QuestionQueries {
  private rowToQuestion(question: {
    id: number;
    eventId: string;
    question: string;
    submitterName: string | null;
    submitterUserId: string | null;
    isAnonymous: boolean;
    isAnswered: boolean;
    answer: string | null;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string | null;
    deleted: Date | null;
  }): Question {
    return {
      id: question.id,
      eventId: question.eventId,
      question: question.question,
      submitterName: question.submitterName,
      submitterUserId: question.submitterUserId,
      isAnonymous: question.isAnonymous,
      isAnswered: question.isAnswered,
      answer: question.answer,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      updatedBy: question.updatedBy,
      deleted: question.deleted,
    };
  }

  getByEventId({
    eventId,
    connection = db,
  }: {
    eventId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Question[]> {
    return TE.tryCatch(
      async () => {
        const results = await connection.query.questions.findMany({
          where: and(eq(questions.eventId, eventId), isNull(questions.deleted)),
          orderBy: (questions, { desc }) => [desc(questions.createdAt)],
        });

        return results.map((question) => this.rowToQuestion(question));
      },
      (error) => error as Error,
    );
  }

  getById({
    id,
    connection = db,
  }: {
    id: number;
    connection?: SchemaConnection;
  }): TaskEither<Error, Question> {
    return TE.tryCatch(
      async () => {
        const question = await connection.query.questions.findFirst({
          where: and(eq(questions.id, id), isNull(questions.deleted)),
        });

        if (!question) {
          throw new NotFoundError("Question not found");
        }
        return this.rowToQuestion(question);
      },
      (error) => error as Error,
    );
  }

  create({
    createQuestion,
    userId,
    userName,
    connection = db,
  }: {
    createQuestion: CreateQuestion;
    userId: string;
    userName?: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Question> {
    return TE.tryCatch(
      async () => {
        const [question] = await connection
          .insert(questions)
          .values({
            ...createQuestion,
            submitterUserId: userId,
            submitterName: createQuestion.isAnonymous ? null : userName,
            updatedBy: userId,
          })
          .returning()
          .execute();

        if (!question) {
          throw new NotFoundError("Question not created");
        }
        return this.rowToQuestion(question);
      },
      (error) => error as Error,
    );
  }

  update({
    questionId,
    updateQuestion,
    userId,
    connection = db,
  }: {
    questionId: number;
    updateQuestion: UpdateQuestion;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Question> {
    return TE.tryCatch(
      async () => {
        const [question] = await connection
          .update(questions)
          .set({ ...updateQuestion, updatedBy: userId })
          .where(and(eq(questions.id, questionId), isNull(questions.deleted)))
          .returning()
          .execute();

        if (!question) {
          throw new NotFoundError("Question not updated");
        }
        return this.rowToQuestion(question);
      },
      (error) => error as Error,
    );
  }

  delete({
    questionId,
    userId,
    connection = db,
  }: {
    questionId: number;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, void> {
    return TE.tryCatch(
      async () => {
        await connection
          .update(questions)
          .set({ deleted: new Date(), updatedBy: userId })
          .where(and(eq(questions.id, questionId), isNull(questions.deleted)))
          .execute();
      },
      (error) => error as Error,
    );
  }
}
