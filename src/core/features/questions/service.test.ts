import "reflect-metadata";
import { setupContainer } from "~/lib/test-container";
import { QuestionQueriesSymbol } from "./adapters/queries";
import type { MockQuestionQueries } from "./adapters/queries.mock";
import { EventQueriesSymbol } from "~/core/features/events/adapters/queries";
import type { MockEventQueries } from "~/core/features/events/adapters/queries.mock";
import { QuestionService } from "./service";
import { ForbiddenError, NotFoundError } from "~/core/common/error";
import type { Question } from "./types";
import type { Event } from "~/core/features/events/types";

function createTestEvent(overrides: Partial<Event> = {}): Event {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    title: "Test Event",
    description: "Test Description",
    start: now,
    end: new Date(now.getTime() + 3600000),
    shortId: undefined,
    creatorId: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    updatedBy: crypto.randomUUID(),
    deleted: null,
    ...overrides,
  };
}

let nextQuestionId = 1;

function createTestQuestion(overrides: Partial<Question> = {}): Question {
  const now = new Date();
  return {
    id: nextQuestionId++,
    eventId: crypto.randomUUID(),
    question: "Test Question?",
    submitterName: "Test User",
    submitterUserId: crypto.randomUUID(),
    isAnonymous: false,
    isAnswered: false,
    answer: null,
    createdAt: now,
    updatedAt: now,
    updatedBy: crypto.randomUUID(),
    deleted: null,
    ...overrides,
  };
}

function setup() {
  const container = setupContainer();
  return {
    service: container.resolve(QuestionService),
    questionQueries: container.resolve<MockQuestionQueries>(QuestionQueriesSymbol),
    eventQueries: container.resolve<MockEventQueries>(EventQueriesSymbol),
  };
}

describe("QuestionService", () => {
  describe("getByEventId", () => {
    it("should return public questions without submitterUserId", async () => {
      const { service, eventQueries, questionQueries } = setup();
      const event = createTestEvent();
      const question = createTestQuestion({ eventId: event.id });
      eventQueries.seed([event]);
      questionQueries.seed([question]);

      const result = await service.getByEventId(event.id);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty("submitterUserId");
      expect(result[0]?.question).toBe("Test Question?");
    });

    it("should return empty array when no questions", async () => {
      const { service } = setup();

      const result = await service.getByEventId(crypto.randomUUID());

      expect(result).toEqual([]);
    });
  });

  describe("getByEventIdForPresenter", () => {
    it("should return full questions including submitterUserId", async () => {
      const { service, questionQueries } = setup();
      const submitterUserId = crypto.randomUUID();
      const question = createTestQuestion({ submitterUserId });
      questionQueries.seed([question]);

      const result = await service.getByEventIdForPresenter(question.eventId);

      expect(result).toHaveLength(1);
      expect(result[0]?.submitterUserId).toBe(submitterUserId);
    });
  });

  describe("getById", () => {
    it("should return question when found", async () => {
      const { service, questionQueries } = setup();
      const question = createTestQuestion();
      questionQueries.seed([question]);

      const result = await service.getById(question.id);

      expect(result).toEqual(question);
    });

    it("should return null when not found", async () => {
      const { service } = setup();

      const result = await service.getById(999999);

      expect(result).toBeNull();
    });
  });

  describe("submit", () => {
    it("should create question when event exists", async () => {
      const { service, eventQueries } = setup();
      const event = createTestEvent();
      const userId = crypto.randomUUID();
      eventQueries.seed([event]);

      const result = await service.submit(
        { eventId: event.id, question: "New Question?", isAnonymous: false },
        userId,
        "Test User",
      );

      expect(result.question).toBe("New Question?");
      expect(result).not.toHaveProperty("submitterUserId");
    });

    it("should throw NotFoundError when event does not exist", async () => {
      const { service } = setup();

      await expect(
        service.submit(
          {
            eventId: crypto.randomUUID(),
            question: "New Question?",
            isAnonymous: false,
          },
          crypto.randomUUID(),
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("should create anonymous question without submitter name", async () => {
      const { service, eventQueries } = setup();
      const event = createTestEvent();
      eventQueries.seed([event]);

      const result = await service.submit(
        { eventId: event.id, question: "Anonymous Question?", isAnonymous: true },
        crypto.randomUUID(),
        "Should Not Appear",
      );

      expect(result.submitterName).toBeNull();
    });
  });

  describe("answer", () => {
    it("should answer question when authorized", async () => {
      const { service, eventQueries, questionQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      const question = createTestQuestion({ eventId: event.id });
      eventQueries.seed([event]);
      questionQueries.seed([question]);

      const result = await service.answer(question.id, "This is the answer", userId);

      expect(result.isAnswered).toBe(true);
      expect(result.answer).toBe("This is the answer");
    });

    it("should throw NotFoundError when question does not exist", async () => {
      const { service } = setup();

      await expect(
        service.answer(999999, "Answer", crypto.randomUUID()),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when event does not exist", async () => {
      const { service, questionQueries } = setup();
      const question = createTestQuestion();
      questionQueries.seed([question]);

      await expect(
        service.answer(question.id, "Answer", crypto.randomUUID()),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when not authorized", async () => {
      const { service, eventQueries, questionQueries } = setup();
      const event = createTestEvent();
      const question = createTestQuestion({ eventId: event.id });
      eventQueries.seed([event]);
      questionQueries.seed([question]);

      await expect(
        service.answer(question.id, "Answer", crypto.randomUUID()),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("delete", () => {
    it("should delete question when authorized", async () => {
      const { service, eventQueries, questionQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      const question = createTestQuestion({ eventId: event.id });
      eventQueries.seed([event]);
      questionQueries.seed([question]);

      await service.delete(question.id, userId);

      const result = await service.getById(question.id);
      expect(result).toBeNull();
    });

    it("should throw NotFoundError when question does not exist", async () => {
      const { service } = setup();

      await expect(service.delete(999999, crypto.randomUUID())).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when not authorized", async () => {
      const { service, eventQueries, questionQueries } = setup();
      const event = createTestEvent();
      const question = createTestQuestion({ eventId: event.id });
      eventQueries.seed([event]);
      questionQueries.seed([question]);

      await expect(service.delete(question.id, crypto.randomUUID())).rejects.toThrow(ForbiddenError);
    });
  });
});
