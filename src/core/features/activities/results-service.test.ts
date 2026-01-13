import "reflect-metadata";
import { setupContainer } from "~/lib/test-container";
import { ActivityQueriesSymbol } from "./adapters/queries";
import type { MockActivityQueries } from "./adapters/queries.mock";
import { ActivityResponseQueriesSymbol } from "~/core/features/responses/adapters/queries";
import type { MockActivityResponseQueries } from "~/core/features/responses/adapters/queries.mock";
import { ActivityResultsService } from "./results-service";
import { NotFoundError } from "~/core/common/error";
import type { Activity } from "./types";
import type { BaseActivityResponse } from "~/core/features/responses/types";

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
    service: container.resolve(ActivityResultsService),
    activityQueries: container.resolve<MockActivityQueries>(ActivityQueriesSymbol),
    responseQueries: container.resolve<MockActivityResponseQueries>(ActivityResponseQueriesSymbol),
  };
}

describe("ActivityResultsService", () => {
  describe("getResultsForActivity", () => {
    it("should throw NotFoundError when activity does not exist", async () => {
      const { service } = setup();

      await expect(service.getResultsForActivity(999999)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should return results for multiple choice activity", async () => {
      const { service, activityQueries, responseQueries } = setup();
      const activity = createTestActivity({
        type: "multiple-choice",
        data: {
          type: "multiple-choice",
          question: "Which option?",
          options: ["A", "B", "C"],
          allowMultiple: false,
        },
      });
      const response1 = createTestResponse({
        activityId: activity.id,
        response: ["A"],
      });
      const response2 = createTestResponse({
        activityId: activity.id,
        response: ["A"],
      });
      const response3 = createTestResponse({
        activityId: activity.id,
        response: ["B"],
      });
      activityQueries.seed([activity]);
      responseQueries.seed([response1, response2, response3]);

      const result = await service.getResultsForActivity(activity.id);

      expect(result.activityType).toBe("multiple-choice");
      expect(result.totalResponses).toBe(3);
      if (result.activityType === "multiple-choice") {
        const optionA = result.options.find((o) => o.value === "A");
        const optionB = result.options.find((o) => o.value === "B");
        expect(optionA?.count).toBe(2);
        expect(optionB?.count).toBe(1);
      }
    });

    it("should return results for ranking activity", async () => {
      const { service, activityQueries, responseQueries } = setup();
      const activity = createTestActivity({
        type: "ranking",
        data: {
          type: "ranking",
          question: "Rank these items",
          items: ["First", "Second", "Third"],
        },
      });
      const response1 = createTestResponse({
        activityId: activity.id,
        response: ["First", "Second", "Third"],
      });
      const response2 = createTestResponse({
        activityId: activity.id,
        response: ["First", "Third", "Second"],
      });
      activityQueries.seed([activity]);
      responseQueries.seed([response1, response2]);

      const result = await service.getResultsForActivity(activity.id);

      expect(result.activityType).toBe("ranking");
      expect(result.totalResponses).toBe(2);
      if (result.activityType === "ranking") {
        expect(result.items).toHaveLength(3);
        const first = result.items.find((i) => i.item === "First");
        expect(first?.averagePosition).toBe(1);
      }
    });

    it("should return results for free response activity", async () => {
      const { service, activityQueries, responseQueries } = setup();
      const activity = createTestActivity({
        type: "free-response",
        data: {
          type: "free-response",
          question: "What do you think?",
        },
      });
      const response1 = createTestResponse({
        activityId: activity.id,
        response: "Great idea",
      });
      const response2 = createTestResponse({
        activityId: activity.id,
        response: "Great idea",
      });
      const response3 = createTestResponse({
        activityId: activity.id,
        response: "Not sure",
      });
      activityQueries.seed([activity]);
      responseQueries.seed([response1, response2, response3]);

      const result = await service.getResultsForActivity(activity.id);

      expect(result.activityType).toBe("free-response");
      expect(result.totalResponses).toBe(3);
      if (result.activityType === "free-response") {
        expect(result.responses).toHaveLength(2);
        const greatIdea = result.responses.find((r) => r.text === "great idea");
        expect(greatIdea?.count).toBe(2);
      }
    });

    it("should return empty results when no responses", async () => {
      const { service, activityQueries } = setup();
      const activity = createTestActivity({
        type: "multiple-choice",
        data: {
          type: "multiple-choice",
          question: "Which option?",
          options: ["A", "B", "C"],
          allowMultiple: false,
        },
      });
      activityQueries.seed([activity]);

      const result = await service.getResultsForActivity(activity.id);

      expect(result.totalResponses).toBe(0);
      if (result.activityType === "multiple-choice") {
        expect(result.options.every((o) => o.count === 0)).toBe(true);
      }
    });

    it("should throw error for unsupported activity type", async () => {
      const { service, activityQueries } = setup();
      const activity = createTestActivity({
        type: "welcome",
        data: { type: "welcome", title: "Welcome" },
      });
      activityQueries.seed([activity]);

      await expect(service.getResultsForActivity(activity.id)).rejects.toThrow(
        "Unsupported activity type: welcome",
      );
    });
  });
});
