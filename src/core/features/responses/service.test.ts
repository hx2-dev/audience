import "reflect-metadata";
import { setupContainer } from "~/lib/test-container";
import { ActivityResponseQueriesSymbol } from "./adapters/queries";
import type { MockActivityResponseQueries } from "./adapters/queries.mock";
import { ActivityQueriesSymbol } from "~/core/features/activities/adapters/queries";
import type { MockActivityQueries } from "~/core/features/activities/adapters/queries.mock";
import { EventQueriesSymbol } from "~/core/features/events/adapters/queries";
import type { MockEventQueries } from "~/core/features/events/adapters/queries.mock";
import { ActivityResponseService } from "./service";
import { NotFoundError } from "~/core/common/error";
import type { BaseActivityResponse } from "./types";
import type { Activity } from "~/core/features/activities/types";
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

let nextActivityId = 1;

function createTestActivity(overrides: Partial<Activity> = {}): Activity {
  const now = new Date();
  return {
    id: nextActivityId++,
    eventId: crypto.randomUUID(),
    name: "Test Activity",
    type: "multiple-choice",
    data: {
      type: "multiple-choice",
      question: "Test question?",
      options: ["A", "B", "C"],
      allowMultiple: false,
    },
    order: 0,
    createdAt: now,
    updatedAt: now,
    updatedBy: crypto.randomUUID(),
    deleted: null,
    ...overrides,
  };
}

let nextResponseId = 1;

function createTestResponse(
  overrides: Partial<BaseActivityResponse> = {},
): BaseActivityResponse {
  const now = new Date();
  return {
    id: nextResponseId++,
    activityId: 0,
    userId: crypto.randomUUID(),
    response: ["A"],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function setup() {
  const container = setupContainer();
  return {
    service: container.resolve(ActivityResponseService),
    responseQueries: container.resolve<MockActivityResponseQueries>(ActivityResponseQueriesSymbol),
    activityQueries: container.resolve<MockActivityQueries>(ActivityQueriesSymbol),
    eventQueries: container.resolve<MockEventQueries>(EventQueriesSymbol),
  };
}

describe("ActivityResponseService", () => {
  describe("getByActivityId", () => {
    it("should return empty array when no responses", async () => {
      const { service } = setup();

      const result = await service.getByActivityId(999999);

      expect(result).toEqual([]);
    });

    it("should return typed responses for multiple choice activity", async () => {
      const { service, eventQueries, activityQueries, responseQueries } = setup();
      const event = createTestEvent();
      const activity = createTestActivity({
        eventId: event.id,
        type: "multiple-choice",
      });
      const response = createTestResponse({
        activityId: activity.id,
        response: ["A", "B"],
      });
      eventQueries.seed([event]);
      activityQueries.seed([activity]);
      responseQueries.seed([response]);

      const result = await service.getByActivityId(activity.id);

      expect(result).toHaveLength(1);
      expect(result[0]?.activityType).toBe("multiple-choice");
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      const { service, responseQueries } = setup();
      const response = createTestResponse({ activityId: 999999 });
      responseQueries.seed([response]);

      await expect(service.getByActivityId(999999)).rejects.toThrow(NotFoundError);
    });
  });

  describe("getUserResponse", () => {
    it("should return null when user has no response", async () => {
      const { service } = setup();

      const result = await service.getUserResponse(crypto.randomUUID(), 999999);

      expect(result).toBeNull();
    });

    it("should return typed response for user", async () => {
      const { service, eventQueries, activityQueries, responseQueries } = setup();
      const event = createTestEvent();
      const activity = createTestActivity({
        eventId: event.id,
        type: "free-response",
        data: {
          type: "free-response",
          question: "What do you think?",
        },
      });
      const userId = crypto.randomUUID();
      const response = createTestResponse({
        activityId: activity.id,
        userId,
        response: "My answer",
      });
      eventQueries.seed([event]);
      activityQueries.seed([activity]);
      responseQueries.seed([response]);

      const result = await service.getUserResponse(userId, activity.id);

      expect(result).not.toBeNull();
      expect(result?.activityType).toBe("free-response");
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      const { service, responseQueries } = setup();
      const userId = crypto.randomUUID();
      const response = createTestResponse({
        activityId: 999999,
        userId,
      });
      responseQueries.seed([response]);

      await expect(
        service.getUserResponse(userId, 999999),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("submitResponse", () => {
    it("should create response for valid activity", async () => {
      const { service, eventQueries, activityQueries } = setup();
      const event = createTestEvent();
      const activity = createTestActivity({
        eventId: event.id,
        type: "multiple-choice",
      });
      const userId = crypto.randomUUID();
      eventQueries.seed([event]);
      activityQueries.seed([activity]);

      const result = await service.submitResponse(
        { activityId: activity.id, response: ["A"] },
        userId,
      );

      expect(result.activityId).toBe(activity.id);
      expect(result.userId).toBe(userId);
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      const { service } = setup();

      await expect(
        service.submitResponse({ activityId: 999999, response: ["A"] }, crypto.randomUUID()),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw error for invalid response data", async () => {
      const { service, eventQueries, activityQueries } = setup();
      const event = createTestEvent();
      const activity = createTestActivity({
        eventId: event.id,
        type: "multiple-choice",
      });
      eventQueries.seed([event]);
      activityQueries.seed([activity]);

      await expect(
        service.submitResponse(
          { activityId: activity.id, response: "not an array" },
          crypto.randomUUID(),
        ),
      ).rejects.toThrow("Invalid response data");
    });
  });

  describe("updateResponse", () => {
    it("should update existing response", async () => {
      const { service, responseQueries } = setup();
      const userId = crypto.randomUUID();
      const response = createTestResponse({ userId, response: ["A"] });
      responseQueries.seed([response]);

      const result = await service.updateResponse(
        { id: response.id, response: ["B", "C"] },
        userId,
      );

      expect(result.id).toBe(response.id);
    });

    it("should throw NotFoundError when response does not exist", async () => {
      const { service } = setup();

      await expect(
        service.updateResponse({ id: 999999, response: ["A"] }, crypto.randomUUID()),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when user does not own response", async () => {
      const { service, responseQueries } = setup();
      const response = createTestResponse({ response: ["A"] });
      responseQueries.seed([response]);

      await expect(
        service.updateResponse({ id: response.id, response: ["B"] }, crypto.randomUUID()),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
