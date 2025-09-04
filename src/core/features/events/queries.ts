import { and, eq, isNull } from "drizzle-orm";
import * as TE from "fp-ts/lib/TaskEither";
import {
  type CreateEvent,
  type Event,
  type UpdateEvent,
} from "~/core/features/events/types";
import type { UndefinedToNullable } from "~/lib/types";
import { singleton } from "tsyringe";
import type { SchemaConnection } from "~/adapters/db";
import { db } from "~/adapters/db";
import { events } from "~/adapters/db/schema";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { NotFoundError } from "~/core/common/error";

@singleton()
export class EventQueries {
  private rowToEvent(event: UndefinedToNullable<Event>): Event {
    return {
      ...event,
      description: event.description ?? undefined,
      shortId: event.shortId ?? undefined,
    };
  }

  getById({
    id,
    connection = db,
  }: {
    id: number;
    connection?: SchemaConnection;
  }): TaskEither<Error, Event> {
    return TE.tryCatch(
      async () => {
        const event = (await connection.query.events.findFirst({
          where: eq(events.id, id),
        })) satisfies UndefinedToNullable<Event> | undefined;

        if (!event) {
          throw new NotFoundError("Event not found");
        }
        return this.rowToEvent(event);
      },
      (error) => error as Error,
    );
  }

  getByCreatorId({
    creatorId,
    connection = db,
  }: {
    creatorId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Event[]> {
    return TE.tryCatch(
      async () => {
        const results = await connection.query.events.findMany({
          where: and(eq(events.creatorId, creatorId), isNull(events.deleted)),
        });
        return results.map((result) => this.rowToEvent(result));
      },
      (error) => error as Error,
    );
  }

  getByShortId({
    shortId,
    connection = db,
  }: {
    shortId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Event> {
    return TE.tryCatch(
      async () => {
        const event = await connection.query.events.findFirst({
          where: and(
            eq(events.shortId, shortId.toUpperCase()),
            isNull(events.deleted),
          ),
        });

        if (!event) {
          throw new NotFoundError("Event not found");
        }
        return this.rowToEvent(event);
      },
      (error) => error as Error,
    );
  }

  create({
    createEvent,
    userId,
    connection = db,
  }: {
    createEvent: CreateEvent;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Event> {
    return TE.tryCatch(
      async () => {
        const [event]: UndefinedToNullable<Event>[] = await connection
          .insert(events)
          .values({ ...createEvent, creatorId: userId, updatedBy: userId })
          .returning()
          .execute();

        if (!event) {
          throw new NotFoundError("Event not created");
        }
        return this.rowToEvent(event);
      },
      (error) => error as Error,
    );
  }

  updateShortId({
    eventId,
    shortId,
    userId,
    connection = db,
  }: {
    eventId: number;
    shortId: string;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Event> {
    return TE.tryCatch(
      async () => {
        const [event]: UndefinedToNullable<Event>[] = await connection
          .update(events)
          .set({
            shortId: shortId.toUpperCase(),
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(events.id, eventId))
          .returning()
          .execute();

        if (!event) {
          throw new NotFoundError("Event not updated");
        }

        return this.rowToEvent(event);
      },
      (error) => error as Error,
    );
  }

  update({
    eventId,
    updateEvent,
    userId,
    connection = db,
  }: {
    eventId: number;
    updateEvent: UpdateEvent;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Event> {
    return TE.tryCatch(
      async () => {
        const [event]: UndefinedToNullable<Event>[] = await connection
          .update(events)
          .set({ ...updateEvent, updatedBy: userId })
          .where(eq(events.id, eventId))
          .returning()
          .execute();

        if (!event) {
          throw new NotFoundError("Event not updated");
        }

        return this.rowToEvent(event);
      },
      (error) => error as Error,
    );
  }

  delete({
    id,
    userId,
    connection = db,
  }: {
    id: number;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, void> {
    return TE.tryCatch(
      async () => {
        await connection
          .update(events)
          .set({ deleted: new Date(), updatedBy: userId })
          .where(eq(events.id, id))
          .execute();
      },
      (error) => error as Error,
    );
  }
}
