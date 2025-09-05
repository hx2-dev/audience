import { inject, singleton } from "tsyringe";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { ActivityResponseQueries } from "~/core/features/responses/queries";
import { ActivityService } from "~/core/features/activities/service";
import { EventService } from "~/core/features/events/service";
import type {
  ActivityResponse,
  CreateActivityResponse,
  UpdateActivityResponse,
} from "~/core/features/responses/types";
import { pipe } from "fp-ts/lib/function";
import { broadcastToEvent } from "~/app/api/events/[shortId]/stream/connections";

@singleton()
export class ActivityResponseService {
  constructor(
    @inject(ActivityResponseQueries)
    private readonly responseQueries: ActivityResponseQueries,
    @inject(ActivityService)
    private readonly activityService: ActivityService,
    @inject(EventService)
    private readonly eventService: EventService,
  ) {}

  getByActivityId(activityId: number): TaskEither<Error, ActivityResponse[]> {
    return this.responseQueries.getByActivityId({ activityId });
  }

  getUserResponse(
    userId: string,
    activityId: number,
  ): TaskEither<Error, ActivityResponse | null> {
    return this.responseQueries.getByUserAndActivity({ userId, activityId });
  }

  submitResponse(
    createResponse: CreateActivityResponse,
    userId: string,
  ): TaskEither<Error, ActivityResponse> {
    return pipe(
      this.activityService.getById(createResponse.activityId),
      TE.flatMap((activity) =>
        pipe(
          this.responseQueries.create({ createResponse, userId }),
          TE.flatMap((response) =>
            pipe(
              this.eventService.getById(activity.eventId),
              TE.flatMap((event) =>
                pipe(
                  this.broadcastResponseUpdate(event.shortId ?? null),
                  TE.map(() => response),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  updateResponse(
    updateResponse: UpdateActivityResponse,
    userId?: string,
  ): TaskEither<Error, ActivityResponse> {
    return this.responseQueries.update({ updateResponse, userId });
  }

  private broadcastResponseUpdate(shortId: string | null) {
    if (!shortId) return TE.right(void 0);

    return TE.tryCatch(
      async () => {
        broadcastToEvent(shortId, ["activity-responses"]);
      },
      (error) => error as Error,
    );
  }
}
