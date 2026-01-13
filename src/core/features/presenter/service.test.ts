import "reflect-metadata";
import { setupContainer } from "~/lib/test-container";
import { PresenterQueriesSymbol } from "./adapters/queries";
import type { MockPresenterQueries } from "./adapters/queries.mock";
import { EventQueriesSymbol } from "~/core/features/events/adapters/queries";
import type { MockEventQueries } from "~/core/features/events/adapters/queries.mock";
import { PresenterService } from "./service";
import { ForbiddenError, NotFoundError } from "~/core/common/error";
import type { PresenterState } from "./types";
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

function createTestPresenterState(
  overrides: Partial<PresenterState> = {},
): PresenterState {
  return {
    eventId: crypto.randomUUID(),
    currentPage: "welcome",
    data: { type: "welcome", title: "Welcome" },
    ...overrides,
  };
}

function setup() {
  const container = setupContainer();
  return {
    service: container.resolve(PresenterService),
    presenterQueries: container.resolve<MockPresenterQueries>(PresenterQueriesSymbol),
    eventQueries: container.resolve<MockEventQueries>(EventQueriesSymbol),
  };
}

describe("PresenterService", () => {
  describe("getByEventId", () => {
    it("should return presenter state when found", async () => {
      const { service, presenterQueries } = setup();
      const state = createTestPresenterState();
      presenterQueries.seed([state]);

      const result = await service.getByEventId(state.eventId);

      expect(result).toEqual(state);
    });

    it("should return null when not found", async () => {
      const { service } = setup();

      const result = await service.getByEventId(crypto.randomUUID());

      expect(result).toBeNull();
    });
  });

  describe("updateState", () => {
    it("should update presenter state when authorized", async () => {
      const { service, eventQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      eventQueries.seed([event]);

      const result = await service.updateState(
        {
          eventId: event.id,
          currentPage: "activity-1",
          data: { type: "welcome", title: "Updated" },
        },
        userId,
      );

      expect(result.currentPage).toBe("activity-1");
      expect(result.data?.type).toBe("welcome");
    });

    it("should throw NotFoundError when event does not exist", async () => {
      const { service } = setup();

      await expect(
        service.updateState(
          {
            eventId: crypto.randomUUID(),
            currentPage: "activity-1",
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
        service.updateState(
          {
            eventId: event.id,
            currentPage: "activity-1",
          },
          crypto.randomUUID(),
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("should upsert state (create if not exists)", async () => {
      const { service, eventQueries } = setup();
      const userId = crypto.randomUUID();
      const event = createTestEvent({ creatorId: userId });
      eventQueries.seed([event]);

      const result = await service.updateState(
        {
          eventId: event.id,
          currentPage: "new-page",
        },
        userId,
      );

      expect(result.eventId).toBe(event.id);
      expect(result.currentPage).toBe("new-page");
    });
  });
});
