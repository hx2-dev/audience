import "reflect-metadata";
import { setupContainer } from "~/lib/test-container";
import { ActivityQueriesSymbol } from "./adapters/queries";
import type { MockActivityQueries } from "./adapters/queries.mock";
import { EventQueriesSymbol } from "~/core/features/events/adapters/queries";
import type { MockEventQueries } from "~/core/features/events/adapters/queries.mock";
import { ActivityService } from "./service";
import { ForbiddenError, NotFoundError } from "~/core/common/error";
import type { Activity } from "./types";
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
    type: "welcome",
    data: { type: "welcome", title: "Welcome" },
    order: 0,
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
    service: container.resolve(ActivityService),
    activityQueries: container.resolve<MockActivityQueries>(ActivityQueriesSymbol),
    eventQueries: container.resolve<MockEventQueries>(EventQueriesSymbol),
  };
}

describe("ActivityService", () => {
  describe("getByEventId", () => {
    it("should return activities for event", async () => {
      const { service, activityQueries } = setup();
      const eventId = crypto.randomUUID();
      const activity1 = createTestActivity({ eventId, order: 0 });
      const activity2 = createTestActivity({ eventId, order: 1 });
      activityQueries.seed([activity1, activity2]);

      const result = await service.getByEventId(eventId);

      expect(result).toHaveLength(2);
    });

    it("should return empty array when no activities", async () => {
      const { service } = setup();

      const result = await service.getByEventId(crypto.randomUUID());

      expect(result).toEqual([]);
    });
  });

  describe("getById", () => {
    it("should return activity when found", async () => {
      const { service, activityQueries } = setup();
      const activity = createTestActivity();
      activityQueries.seed([activity]);

      const result = await service.getById(activity.id);

      expect(result).toEqual(activity);
    });

    it("should return null when not found", async () => {
      const { service } = setup();

      const result = await service.getById(999999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create activity when authorized", async () => {
      const { service, eventQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      eventQueries.seed([event]);

      const result = await service.create(
        {
          eventId: event.id,
          name: "New Activity",
          type: "welcome",
          data: { type: "welcome", title: "Welcome" },
          order: 0,
        },
        userId,
      );

      expect(result.name).toBe("New Activity");
      expect(result.eventId).toBe(event.id);
    });

    it("should throw NotFoundError when event does not exist", async () => {
      const { service } = setup();

      await expect(
        service.create(
          {
            eventId: crypto.randomUUID(),
            name: "New Activity",
            type: "welcome",
            data: { type: "welcome", title: "Welcome" },
            order: 0,
          },
          crypto.randomUUID(),
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when not authorized", async () => {
      const { service, eventQueries } = setup();
      const event = createTestEvent();
      eventQueries.seed([event]);

      await expect(
        service.create(
          {
            eventId: event.id,
            name: "New Activity",
            type: "welcome",
            data: { type: "welcome", title: "Welcome" },
            order: 0,
          },
          crypto.randomUUID(),
        ),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("update", () => {
    it("should update activity when authorized", async () => {
      const { service, eventQueries, activityQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      const activity = createTestActivity({ eventId: event.id });
      eventQueries.seed([event]);
      activityQueries.seed([activity]);

      const result = await service.update(
        activity.id,
        { id: activity.id, name: "Updated Activity" },
        userId,
      );

      expect(result.name).toBe("Updated Activity");
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      const { service } = setup();

      await expect(
        service.update(999999, { id: 999999, name: "Updated" }, crypto.randomUUID()),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when not authorized", async () => {
      const { service, eventQueries, activityQueries } = setup();
      const event = createTestEvent();
      const activity = createTestActivity({ eventId: event.id });
      eventQueries.seed([event]);
      activityQueries.seed([activity]);

      await expect(
        service.update(activity.id, { id: activity.id, name: "Updated" }, crypto.randomUUID()),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("delete", () => {
    it("should delete activity when authorized", async () => {
      const { service, eventQueries, activityQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      const activity = createTestActivity({ eventId: event.id });
      eventQueries.seed([event]);
      activityQueries.seed([activity]);

      await service.delete(activity.id, userId);

      const result = await service.getById(activity.id);
      expect(result).toBeNull();
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      const { service } = setup();

      await expect(service.delete(999999, crypto.randomUUID())).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when not authorized", async () => {
      const { service, eventQueries, activityQueries } = setup();
      const event = createTestEvent();
      const activity = createTestActivity({ eventId: event.id });
      eventQueries.seed([event]);
      activityQueries.seed([activity]);

      await expect(service.delete(activity.id, crypto.randomUUID())).rejects.toThrow(ForbiddenError);
    });
  });

  describe("reorder", () => {
    it("should reorder activities when authorized", async () => {
      const { service, eventQueries, activityQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      const activity1 = createTestActivity({ eventId: event.id, order: 0 });
      const activity2 = createTestActivity({ eventId: event.id, order: 1 });
      eventQueries.seed([event]);
      activityQueries.seed([activity1, activity2]);

      await service.reorder([activity2.id, activity1.id], userId);

      const activities = await service.getByEventId(event.id);
      const orderedIds = activities.sort((a, b) => a.order - b.order).map((a) => a.id);
      expect(orderedIds).toEqual([activity2.id, activity1.id]);
    });

    it("should throw error when no activities provided", async () => {
      const { service } = setup();

      await expect(service.reorder([], crypto.randomUUID())).rejects.toThrow(
        "No activities to reorder",
      );
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      const { service } = setup();

      await expect(service.reorder([999999], crypto.randomUUID())).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when not authorized", async () => {
      const { service, eventQueries, activityQueries } = setup();
      const event = createTestEvent();
      const activity = createTestActivity({ eventId: event.id });
      eventQueries.seed([event]);
      activityQueries.seed([activity]);

      await expect(service.reorder([activity.id], crypto.randomUUID())).rejects.toThrow(ForbiddenError);
    });
  });

  describe("getResults", () => {
    it("should return results when authorized", async () => {
      const { service, eventQueries, activityQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      const activity = createTestActivity({
        eventId: event.id,
        type: "multiple-choice",
        data: {
          type: "multiple-choice",
          question: "Test?",
          options: ["A", "B"],
          allowMultiple: false,
        },
      });
      eventQueries.seed([event]);
      activityQueries.seed([activity]);

      const result = await service.getResults(activity.id, userId);

      expect(result).toBeDefined();
      expect(result.activityId).toBe(activity.id);
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      const { service } = setup();

      await expect(service.getResults(999999, crypto.randomUUID())).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when not authorized", async () => {
      const { service, eventQueries, activityQueries } = setup();
      const event = createTestEvent();
      const activity = createTestActivity({ eventId: event.id });
      eventQueries.seed([event]);
      activityQueries.seed([activity]);

      await expect(service.getResults(activity.id, crypto.randomUUID())).rejects.toThrow(ForbiddenError);
    });
  });
});
