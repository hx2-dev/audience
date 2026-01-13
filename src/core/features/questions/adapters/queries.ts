import { singleton } from "tsyringe";
import { supabaseServiceClient } from "~/core/adapters/db/supabase";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "~/core/adapters/db/database.types";
import type {
  CreateQuestion,
  Question,
  UpdateQuestion,
} from "~/core/features/questions/types";

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

  async getByEventId({ eventId }: { eventId: string }): Promise<Question[]> {
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
  }

  async getById({ id }: { id: number }): Promise<Question | null> {
    const { data: question, error } = await supabaseServiceClient
      .from("hx2-audience_question")
      .select("*")
      .eq("id", id)
      .is("deleted", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(error.message);
    }

    if (!question) {
      return null;
    }

    return this.rowToQuestion(question);
  }

  async create({
    createQuestion,
    userId,
    userName,
  }: {
    createQuestion: CreateQuestion;
    userId: string;
    userName?: string;
  }): Promise<Question> {
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
      throw new Error("Question not created");
    }

    return this.rowToQuestion(question);
  }

  async update({
    questionId,
    updateQuestion,
    userId,
  }: {
    questionId: number;
    updateQuestion: UpdateQuestion;
    userId: string;
  }): Promise<Question | null> {
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
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(error.message);
    }

    if (!question) {
      return null;
    }

    return this.rowToQuestion(question);
  }

  async delete({
    questionId,
    userId,
  }: {
    questionId: number;
    userId: string;
  }): Promise<void> {
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
  }
}
