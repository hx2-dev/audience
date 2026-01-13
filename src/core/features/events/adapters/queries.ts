import { singleton } from "tsyringe";
import { supabaseServiceClient } from "~/core/adapters/db/supabase";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "~/core/adapters/db/database.types";
import type {
  CreateEvent,
  Event,
  UpdateEvent,
} from "~/core/features/events/types";

type EventRow = Tables<"hx2-audience_event">;
type EventInsert = TablesInsert<"hx2-audience_event">;
type EventUpdate = TablesUpdate<"hx2-audience_event">;

export const EventQueriesSymbol = Symbol("EventQueries");

export interface IEventQueries {
  getById({ id }: { id: string }): Promise<Event | null>;
  getByCreatorId({ creatorId }: { creatorId: string }): Promise<Event[]>;
  getByShortId({ shortId }: { shortId: string }): Promise<Event | null>;
  create({
    createEvent,
    userId,
  }: {
    createEvent: CreateEvent;
    userId: string;
  }): Promise<Event>;
  updateShortId({
    eventId,
    shortId,
    userId,
  }: {
    eventId: string;
    shortId: string;
    userId: string;
  }): Promise<Event | null>;
  update({
    eventId,
    updateEvent,
    userId,
  }: {
    eventId: string;
    updateEvent: UpdateEvent;
    userId: string;
  }): Promise<Event | null>;
  delete({ id, userId }: { id: string; userId: string }): Promise<void>;
}

@singleton()
export class EventQueries {
  private rowToEvent(event: EventRow): Event {
    return {
      id: event.id,
      title: event.title,
      description: event.description ?? undefined,
      start: new Date(event.start),
      end: new Date(event.end),
      shortId: event.shortId ?? undefined,
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
      creatorId: event.creatorId,
      updatedBy: event.updatedBy,
      deleted: event.deleted ? new Date(event.deleted) : null,
    };
  }

  async getById({ id }: { id: string }): Promise<Event | null> {
    const { data: event, error } = await supabaseServiceClient
      .from("hx2-audience_event")
      .select("*")
      .eq("id", id)
      .is("deleted", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!event) {
      return null;
    }

    return this.rowToEvent(event);
  }

  async getByCreatorId({ creatorId }: { creatorId: string }): Promise<Event[]> {
    const { data: events, error } = await supabaseServiceClient
      .from("hx2-audience_event")
      .select("*")
      .eq("creatorId", creatorId)
      .is("deleted", null);

    if (error) {
      throw new Error(error.message);
    }

    return events.map((event) => this.rowToEvent(event));
  }

  async getByShortId({ shortId }: { shortId: string }): Promise<Event | null> {
    const { data: event, error } = await supabaseServiceClient
      .from("hx2-audience_event")
      .select("*")
      .eq("shortId", shortId.toUpperCase())
      .is("deleted", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!event) {
      return null;
    }

    return this.rowToEvent(event);
  }

  async create({
    createEvent,
    userId,
  }: {
    createEvent: CreateEvent;
    userId: string;
  }): Promise<Event> {
    const eventData: EventInsert = {
      id: crypto.randomUUID(),
      title: createEvent.title,
      description: createEvent.description ?? null,
      start: createEvent.start.toISOString(),
      end: createEvent.end.toISOString(),
      creatorId: userId,
      updatedBy: userId,
    };

    const { data: event, error } = await supabaseServiceClient
      .from("hx2-audience_event")
      .insert(eventData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!event) {
      throw new Error("Event not created");
    }

    return this.rowToEvent(event);
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
    const { data: event, error } = await supabaseServiceClient
      .from("hx2-audience_event")
      .update({
        shortId: shortId.toUpperCase(),
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!event) {
      return null;
    }

    return this.rowToEvent(event);
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
    const updateData: EventUpdate = {
      ...updateEvent,
      start: updateEvent.start?.toISOString(),
      end: updateEvent.end?.toISOString(),
      description: updateEvent.description ?? null,
      updatedBy: userId,
    };

    const { data: event, error } = await supabaseServiceClient
      .from("hx2-audience_event")
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!event) {
      return null;
    }

    return this.rowToEvent(event);
  }

  async delete({ id, userId }: { id: string; userId: string }): Promise<void> {
    const { error } = await supabaseServiceClient
      .from("hx2-audience_event")
      .update({
        deleted: new Date().toISOString(),
        updatedBy: userId,
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }
}
