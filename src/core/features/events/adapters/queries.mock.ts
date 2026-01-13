import { injectable } from "tsyringe";
import type { CreateEvent, Event, UpdateEvent } from "../types";

@injectable()
export class MockEventQueries {
  private events = new Map<string, Event>();

  async getById({ id }: { id: string }): Promise<Event | null> {
    const event = this.events.get(id);
    if (!event || event.deleted) {
      return null;
    }
    return event;
  }

  async getByCreatorId({ creatorId }: { creatorId: string }): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.creatorId === creatorId && !event.deleted,
    );
  }

  async getByShortId({ shortId }: { shortId: string }): Promise<Event | null> {
    const upperShortId = shortId.toUpperCase();
    const event = Array.from(this.events.values()).find(
      (e) => e.shortId?.toUpperCase() === upperShortId && !e.deleted,
    );
    return event ?? null;
  }

  async create({
    createEvent,
    userId,
  }: {
    createEvent: CreateEvent;
    userId: string;
  }): Promise<Event> {
    const now = new Date();
    const event: Event = {
      id: crypto.randomUUID(),
      title: createEvent.title,
      description: createEvent.description,
      start: createEvent.start,
      end: createEvent.end,
      shortId: undefined,
      creatorId: userId,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
      deleted: null,
    };
    this.events.set(event.id, event);
    return event;
  }

  async updateShortId({
    eventId,
    shortId,
    userId,
  }: {
    eventId: string;
    shortId: string;
    userId: string;
  }): Promise<Event | null> {
    const event = this.events.get(eventId);
    if (!event || event.deleted) {
      return null;
    }
    const updated: Event = {
      ...event,
      shortId: shortId.toUpperCase(),
      updatedAt: new Date(),
      updatedBy: userId,
    };
    this.events.set(eventId, updated);
    return updated;
  }

  async update({
    eventId,
    updateEvent,
    userId,
  }: {
    eventId: string;
    updateEvent: UpdateEvent;
    userId: string;
  }): Promise<Event | null> {
    const event = this.events.get(eventId);
    if (!event || event.deleted) {
      return null;
    }
    const updated: Event = {
      ...event,
      ...(updateEvent.title !== undefined && { title: updateEvent.title }),
      ...(updateEvent.description !== undefined && {
        description: updateEvent.description,
      }),
      ...(updateEvent.start !== undefined && { start: updateEvent.start }),
      ...(updateEvent.end !== undefined && { end: updateEvent.end }),
      updatedAt: new Date(),
      updatedBy: userId,
    };
    this.events.set(eventId, updated);
    return updated;
  }

  async delete({ id, userId }: { id: string; userId: string }): Promise<void> {
    const event = this.events.get(id);
    if (event && !event.deleted) {
      this.events.set(id, {
        ...event,
        deleted: new Date(),
        updatedBy: userId,
      });
    }
  }

  seed(events: Event[]): void {
    for (const event of events) {
      this.events.set(event.id, event);
    }
  }

  reset(): void {
    this.events.clear();
  }

  getAll(): Event[] {
    return Array.from(this.events.values());
  }
}
