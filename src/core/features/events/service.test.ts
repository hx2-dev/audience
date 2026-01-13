import "reflect-metadata";
import { setupContainer } from "~/lib/test-container";
import { EventQueriesSymbol } from "./adapters/queries";
import type { MockEventQueries } from "./adapters/queries.mock";
import { EventService } from "./service";
import { ForbiddenError, NotFoundError } from "~/core/common/error";
import type { Event } from "./types";

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

function setup() {
  const container = setupContainer();
  return {
    service: container.resolve(EventService),
    eventQueries: container.resolve<MockEventQueries>(EventQueriesSymbol),
  };
}

describe("EventService", () => {
  describe("getById", () => {
    it("should return event when found", async () => {
      const { service, eventQueries } = setup();
      const event = createTestEvent();
      eventQueries.seed([event]);

      const result = await service.getById(event.id);

      expect(result).toEqual(event);
    });

    it("should return null when not found", async () => {
      const { service } = setup();

      const result = await service.getById(crypto.randomUUID());

      expect(result).toBeNull();
    });

    it("should return null for deleted events", async () => {
      const { service, eventQueries } = setup();
      const event = createTestEvent({ deleted: new Date() });
      eventQueries.seed([event]);

      const result = await service.getById(event.id);

      expect(result).toBeNull();
    });
  });

  describe("getByShortId", () => {
    it("should return event when found", async () => {
      const { service, eventQueries } = setup();
      const shortId = crypto.randomUUID().substring(0, 6).toUpperCase();
      const event = createTestEvent({ shortId });
      eventQueries.seed([event]);

      const result = await service.getByShortId(shortId.toLowerCase());

      expect(result).toEqual(event);
    });

    it("should return null when not found", async () => {
      const { service } = setup();

      const result = await service.getByShortId(crypto.randomUUID());

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create and return new event", async () => {
      const { service } = setup();
      const userId = crypto.randomUUID();
      const createEvent = {
        title: "New Event",
        description: "Description",
        start: new Date(),
        end: new Date(),
      };

      const result = await service.create(createEvent, userId);

      expect(result.title).toBe("New Event");
      expect(result.description).toBe("Description");
      expect(result.creatorId).toBe(userId);
      expect(result.id).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update event when authorized", async () => {
      const { service, eventQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      eventQueries.seed([event]);

      const result = await service.update(
        event.id,
        { title: "Updated Title" },
        userId,
      );

      expect(result.title).toBe("Updated Title");
    });

    it("should throw NotFoundError when event does not exist", async () => {
      const { service } = setup();

      await expect(
        service.update(crypto.randomUUID(), { title: "Updated Title" }, crypto.randomUUID()),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when not authorized", async () => {
      const { service, eventQueries } = setup();
      const event = createTestEvent();
      eventQueries.seed([event]);

      await expect(
        service.update(event.id, { title: "Updated Title" }, crypto.randomUUID()),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("delete", () => {
    it("should delete event when authorized", async () => {
      const { service, eventQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      eventQueries.seed([event]);

      await service.delete(event.id, userId);

      const result = await service.getById(event.id);
      expect(result).toBeNull();
    });

    it("should throw NotFoundError when event does not exist", async () => {
      const { service } = setup();

      await expect(service.delete(crypto.randomUUID(), crypto.randomUUID())).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should throw ForbiddenError when not authorized", async () => {
      const { service, eventQueries } = setup();
      const event = createTestEvent();
      eventQueries.seed([event]);

      await expect(service.delete(event.id, crypto.randomUUID())).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe("checkPresenterAccess", () => {
    it("should return event when authorized", async () => {
      const { service, eventQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      eventQueries.seed([event]);

      const result = await service.checkPresenterAccess(event.id, userId);

      expect(result).toEqual(event);
    });

    it("should throw NotFoundError when event does not exist", async () => {
      const { service } = setup();

      await expect(
        service.checkPresenterAccess(crypto.randomUUID(), crypto.randomUUID()),
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when not authorized", async () => {
      const { service, eventQueries } = setup();
      const event = createTestEvent();
      eventQueries.seed([event]);

      await expect(
        service.checkPresenterAccess(event.id, crypto.randomUUID()),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("generateShortId", () => {
    it("should generate unique shortId", async () => {
      const { service, eventQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      eventQueries.seed([event]);

      const shortId = await service.generateShortId(event.id, userId);

      expect(shortId).toBeDefined();
      expect(shortId.length).toBeGreaterThan(0);
    });

    it("should retry if shortId already exists", async () => {
      const { service, eventQueries } = setup();
      const userId = crypto.randomUUID();
      const existingShortId = crypto.randomUUID().substring(0, 6).toUpperCase();
      const existingEvent = createTestEvent({ shortId: existingShortId });
      const targetEvent = createTestEvent({ creatorId: userId });
      eventQueries.seed([existingEvent, targetEvent]);

      const shortId = await service.generateShortId(targetEvent.id, userId);

      expect(shortId).toBeDefined();
      expect(shortId).not.toBe(existingShortId);
    });
  });
});
