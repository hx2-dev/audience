import { injectable, inject } from "tsyringe";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import type { Event } from "~/core/features/events/types";
import { PresenterQueries } from "~/core/features/presenter/queries";
import { EventService } from "~/core/features/events/service";
import { ForbiddenError } from "~/core/common/error";
import type {
  PresenterState,
  UpdatePresenterState,
} from "~/core/features/presenter/types";
import { pipe } from "fp-ts/lib/function";

export const PresenterServiceSymbol = Symbol("PresenterService");

@injectable({ token: PresenterServiceSymbol })
export class PresenterService {
  constructor(
    @inject(PresenterQueries)
    private readonly presenterQueries: PresenterQueries,
    @inject(EventService)
    private readonly eventService: EventService,
  ) {}

  getByEventId(eventId: number): TaskEither<Error, PresenterState> {
    return this.presenterQueries.getByEventId({ eventId });
  }

  updateState(
    updateState: UpdatePresenterState,
    userId: string,
  ): TaskEither<Error, PresenterState> {
    return pipe(
      this.eventService.getById(updateState.eventId),
      TE.flatMap(this.checkEventAuthorization(userId)),
      TE.flatMap((event: Event) =>
        pipe(
          this.presenterQueries.upsert({ updateState }),
          TE.tap((state: PresenterState) => {
            const shortId = event.shortId;
            if (shortId) {
              return this.broadcastStateChange(shortId, state);
            }
            return TE.right(void 0);
          }),
        ),
      ),
    );
  }

  private broadcastStateChange(shortId: string, _state: PresenterState) {
    return TE.tryCatch(
      async () => {
        const { broadcastToEvent } = await import(
          "~/app/api/events/[shortId]/stream/route"
        );
        broadcastToEvent(shortId, ["presenter-state"]);
        console.log(
          `[Presenter Service] Broadcast completed for shortId: ${shortId}`,
        );
      },
      (error) => error as Error,
    );
  }

  private checkEventAuthorization(userId: string) {
    return TE.fromPredicate(
      (event: Event) => event.creatorId === userId,
      (event: Event) =>
        new ForbiddenError(
          `User ${userId} is not authorized to control event ${event.id}`,
        ),
    );
  }
}
