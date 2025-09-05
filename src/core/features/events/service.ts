import { inject, singleton } from "tsyringe";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import type { CreateEvent, Event, UpdateEvent } from "./types";
import { EventQueries } from "./queries";
import { ForbiddenError, NotFoundError } from "~/core/common/error";
import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/lib/Either";

@singleton()
export class EventService {
  constructor(
    @inject(EventQueries)
    private readonly eventQueries: EventQueries,
  ) {}

  getById(id: number): TaskEither<Error, Event> {
    return this.eventQueries.getById({ id });
  }

  getByShortId(shortId: string): TaskEither<Error, Event> {
    return this.eventQueries.getByShortId({ shortId });
  }

  create(createEvent: CreateEvent, userId: string): TaskEither<Error, Event> {
    return this.eventQueries.create({ createEvent, userId });
  }

  update(
    eventId: number,
    updateEvent: UpdateEvent,
    userId: string,
  ): TaskEither<Error, Event> {
    return pipe(
      this.getById(eventId),
      TE.flatMap(this.checkEventAuthorization(userId)),
      TE.flatMap(() =>
        this.eventQueries.update({ eventId, updateEvent, userId }),
      ),
    );
  }

  generateShortId(eventId: number, userId: string): TaskEither<Error, string> {
    return TE.tryCatch(
      async () => {
        let shortId: string;
        while (true) {
          shortId = Math.random().toString(36).substring(2, 8);
          const result = await this.eventQueries.getByShortId({ shortId })();
          if (E.isLeft(result) && result.left instanceof NotFoundError) {
            await this.eventQueries.updateShortId({
              eventId,
              shortId,
              userId,
            })();
            return shortId;
          } else {
            continue;
          }
        }
      },
      (error) => error as Error,
    );
  }

  delete(eventId: number, userId: string): TaskEither<Error, void> {
    return pipe(
      this.getById(eventId),
      TE.flatMap(this.checkEventAuthorization(userId)),
      TE.flatMap(() => this.eventQueries.delete({ id: eventId, userId })),
    );
  }

  checkPresenterAccess(eventId: number, userId: string): TaskEither<Error, Event> {
    return pipe(
      this.getById(eventId),
      TE.flatMap(this.checkEventAuthorization(userId)),
    );
  }

  private checkEventAuthorization(userId: string) {
    return TE.fromPredicate(
      (event: Event) => event.creatorId === userId,
      (event: Event) =>
        new ForbiddenError(
          `User ${userId} is not authorized to access event ${event.id}`,
        ),
    );
  }
}
