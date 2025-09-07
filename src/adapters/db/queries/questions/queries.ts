import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { singleton } from "tsyringe";
import { supabaseServiceClient } from "~/adapters/db/supabase";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "~/adapters/db/database.types";
import type {
  CreateQuestion,
  Question,
  UpdateQuestion,
} from "~/core/features/questions/types";
import { NotFoundError } from "~/core/common/error";

type QuestionRow = Tables<"hx2-audience_question">;
type QuestionInsert = TablesInsert<"hx2-audience_question">;
type QuestionUpdate = TablesUpdate<"hx2-audience_question">;

@singleton()
export class QuestionQueries {
  private rowToQuestion(question: QuestionRow): Question {
    return {
      id: question.id,
      eventId: question.eventId,
      question: question.question,
      submitterName: question.submitterName,
      submitterUserId: question.submitterUserId,
      isAnonymous: question.isAnonymous,
      isAnswered: question.isAnswered,
      answer: question.answer,
      createdAt: new Date(question.createdAt),
      updatedAt: new Date(question.updatedAt),
      updatedBy: question.updatedBy,
      deleted: question.deleted ? new Date(question.deleted) : null,
    };
  }

  getByEventId({
    eventId,
  }: {
    eventId: string;
  }): TaskEither<Error, Question[]> {
    return TE.tryCatch(
      async () => {
        const { data: questions, error } = await supabaseServiceClient
          .from("hx2-audience_question")
          .select("*")
          .eq("eventId", eventId)
          .is("deleted", null)
          .order("createdAt", { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        return questions.map((question) => this.rowToQuestion(question));
      },
      (error) => error as Error,
    );
  }

  getById({ id }: { id: number }): TaskEither<Error, Question> {
    return TE.tryCatch(
      async () => {
        const { data: question, error } = await supabaseServiceClient
          .from("hx2-audience_question")
          .select("*")
          .eq("id", id)
          .is("deleted", null)
          .single();

        if (error) {
          throw new Error(error.message);
        }

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
  }: {
    createQuestion: CreateQuestion;
    userId: string;
    userName?: string;
  }): TaskEither<Error, Question> {
    return TE.tryCatch(
      async () => {
        const questionData: QuestionInsert = {
          eventId: createQuestion.eventId,
          question: createQuestion.question,
          isAnonymous: createQuestion.isAnonymous,
          submitterUserId: userId,
          submitterName: createQuestion.isAnonymous ? null : (userName ?? null),
          updatedBy: userId,
        };

        const { data: question, error } = await supabaseServiceClient
          .from("hx2-audience_question")
          .insert(questionData)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

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
  }: {
    questionId: number;
    updateQuestion: UpdateQuestion;
    userId: string;
  }): TaskEither<Error, Question> {
    return TE.tryCatch(
      async () => {
        const updateData: QuestionUpdate = {
          ...updateQuestion,
          updatedBy: userId,
        };

        const { data: question, error } = await supabaseServiceClient
          .from("hx2-audience_question")
          .update(updateData)
          .eq("id", questionId)
          .is("deleted", null)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

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
  }: {
    questionId: number;
    userId: string;
  }): TaskEither<Error, void> {
    return TE.tryCatch(
      async () => {
        const { error } = await supabaseServiceClient
          .from("hx2-audience_question")
          .update({
            deleted: new Date().toISOString(),
            updatedBy: userId,
          })
          .eq("id", questionId)
          .is("deleted", null);

        if (error) {
          throw new Error(error.message);
        }
      },
      (error) => error as Error,
    );
  }
}
