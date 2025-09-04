import { inject, singleton } from "tsyringe";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { ActivityQueries } from "~/core/features/activities/queries";
import { EventService } from "~/core/features/events/service";
import { ForbiddenError } from "~/core/common/error";
import type {
  Activity,
  CreateActivity,
  UpdateActivity,
} from "~/core/features/activities/types";
import type { Event } from "~/core/features/events/types";
import { pipe } from "fp-ts/lib/function";

@singleton()
export class ActivityService {
  constructor(
    @inject(ActivityQueries)
    private readonly activityQueries: ActivityQueries,
    @inject(EventService)
    private readonly eventService: EventService,
  ) {}

  getByEventId(eventId: number): TaskEither<Error, Activity[]> {
    return this.activityQueries.getByEventId({ eventId });
  }

  getById(id: number): TaskEither<Error, Activity> {
    return this.activityQueries.getById({ id });
  }

  create(
    createActivity: CreateActivity,
    userId: string,
  ): TaskEither<Error, Activity> {
    return pipe(
      this.eventService.getById(createActivity.eventId),
      TE.flatMap(this.checkEventAuthorization(userId)),
      TE.flatMap(() => this.activityQueries.create({ createActivity, userId })),
    );
  }

  update(
    activityId: number,
    updateActivity: UpdateActivity,
    userId: string,
  ): TaskEither<Error, Activity> {
    return pipe(
      this.getById(activityId),
      TE.flatMap((activity) =>
        pipe(
          this.eventService.getById(activity.eventId),
          TE.flatMap(this.checkEventAuthorization(userId)),
        ),
      ),
      TE.flatMap(() =>
        this.activityQueries.update({ activityId, updateActivity, userId }),
      ),
    );
  }

  delete(activityId: number, userId: string): TaskEither<Error, void> {
    return pipe(
      this.getById(activityId),
      TE.flatMap((activity) =>
        pipe(
          this.eventService.getById(activity.eventId),
          TE.flatMap(this.checkEventAuthorization(userId)),
        ),
      ),
      TE.flatMap(() => this.activityQueries.delete({ id: activityId, userId })),
    );
  }

  reorder(activityIds: number[], userId: string): TaskEither<Error, void> {
    return pipe(
      // Verify user has access to the first activity to check event ownership
      activityIds.length > 0
        ? this.getById(activityIds[0]!)
        : TE.left(new Error("No activities to reorder")),
      TE.flatMap((activity) =>
        pipe(
          this.eventService.getById(activity.eventId),
          TE.flatMap(this.checkEventAuthorization(userId)),
        ),
      ),
      TE.flatMap(() => this.activityQueries.reorder({ activityIds, userId })),
    );
  }

  private checkEventAuthorization(userId: string) {
    return TE.fromPredicate(
      (event: Event) => event.creatorId === userId,
      (event: Event) =>
        new ForbiddenError(
          `User ${userId} is not authorized to manage activities for event ${event.id}`,
        ),
    );
  }
}
