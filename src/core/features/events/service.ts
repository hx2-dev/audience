import { inject, singleton } from "tsyringe";
import type { CreateEvent, Event, UpdateEvent } from "./types";
import { type EventQueries, EventQueriesSymbol } from "./adapters/queries";
import { ForbiddenError, NotFoundError } from "~/core/common/error";

@singleton()
export class EventService {
  constructor(
    @inject(EventQueriesSymbol)
    private readonly eventQueries: EventQueries,
  ) {}

  async getById(id: string): Promise<Event | null> {
    return this.eventQueries.getById({ id });
  }

  async getByShortId(shortId: string): Promise<Event | null> {
    return this.eventQueries.getByShortId({ shortId });
  }

  async create(createEvent: CreateEvent, userId: string): Promise<Event> {
    return this.eventQueries.create({ createEvent, userId });
  }

  async update(
    eventId: string,
    updateEvent: UpdateEvent,
    userId: string,
  ): Promise<Event> {
    const event = await this.getById(eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    const updated = await this.eventQueries.update({
      eventId,
      updateEvent,
      userId,
    });
    if (!updated) {
      throw new NotFoundError("Event not updated");
    }
    return updated;
  }

  async generateShortId(eventId: string, userId: string): Promise<string> {
    while (true) {
      const shortId = Math.random().toString(36).substring(2, 8);
      const existing = await this.eventQueries.getByShortId({ shortId });
      if (!existing) {
        await this.eventQueries.updateShortId({ eventId, shortId, userId });
        return shortId;
      }
    }
  }

  async delete(eventId: string, userId: string): Promise<void> {
    const event = await this.getById(eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    await this.eventQueries.delete({ id: eventId, userId });
  }

  async checkPresenterAccess(eventId: string, userId: string): Promise<Event> {
    const event = await this.getById(eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    return event;
  }

  private checkEventAuthorization(event: Event, userId: string): void {
    if (event.creatorId !== userId) {
      throw new ForbiddenError(
        `User ${userId} is not authorized to access event ${event.id}`,
      );
    }
  }
}
