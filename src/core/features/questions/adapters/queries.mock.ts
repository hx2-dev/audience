import { injectable } from "tsyringe";
import type { CreateQuestion, Question, UpdateQuestion } from "../types";

@injectable()
export class MockQuestionQueries {
  private questions = new Map<number, Question>();
  private nextId = 1;

  async getByEventId({ eventId }: { eventId: string }): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter((q) => q.eventId === eventId && !q.deleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getById({ id }: { id: number }): Promise<Question | null> {
    const question = this.questions.get(id);
    if (!question || question.deleted) {
      return null;
    }
    return question;
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
    const now = new Date();
    const question: Question = {
      id: this.nextId++,
      eventId: createQuestion.eventId,
      question: createQuestion.question,
      isAnonymous: createQuestion.isAnonymous,
      submitterUserId: userId,
      submitterName: createQuestion.isAnonymous ? null : (userName ?? null),
      isAnswered: false,
      answer: null,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
      deleted: null,
    };
    this.questions.set(question.id, question);
    return question;
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
    const question = this.questions.get(questionId);
    if (!question || question.deleted) {
      return null;
    }
    const updated: Question = {
      ...question,
      ...(updateQuestion.isAnswered !== undefined && {
        isAnswered: updateQuestion.isAnswered,
      }),
      ...(updateQuestion.answer !== undefined && {
        answer: updateQuestion.answer,
      }),
      updatedAt: new Date(),
      updatedBy: userId,
    };
    this.questions.set(questionId, updated);
    return updated;
  }

  async delete({
    questionId,
    userId,
  }: {
    questionId: number;
    userId: string;
  }): Promise<void> {
    const question = this.questions.get(questionId);
    if (question && !question.deleted) {
      this.questions.set(questionId, {
        ...question,
        deleted: new Date(),
        updatedBy: userId,
      });
    }
  }

  seed(questions: Question[]): void {
    for (const question of questions) {
      this.questions.set(question.id, question);
      if (question.id >= this.nextId) {
        this.nextId = question.id + 1;
      }
    }
  }

  reset(): void {
    this.questions.clear();
    this.nextId = 1;
  }

  getAll(): Question[] {
    return Array.from(this.questions.values());
  }
}
