import { inject, singleton } from "tsyringe";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { ActivityResponseQueries } from "~/core/features/responses/queries";
import { ActivityService } from "~/core/features/activities/service";
import type {
  ActivityResponse,
  CreateActivityResponse,
  UpdateActivityResponse,
} from "~/core/features/responses/types";
import { pipe } from "fp-ts/lib/function";

@singleton()
export class ActivityResponseService {
  constructor(
    @inject(ActivityResponseQueries)
    private readonly responseQueries: ActivityResponseQueries,
    @inject(ActivityService)
    private readonly activityService: ActivityService,
  ) {}

  getByActivityId(activityId: number): TaskEither<Error, ActivityResponse[]> {
    return this.responseQueries.getByActivityId({ activityId });
  }

  getUserResponse(userId: string, activityId: number): TaskEither<Error, ActivityResponse | null> {
    return this.responseQueries.getByUserAndActivity({ userId, activityId });
  }

  submitResponse(
    createResponse: CreateActivityResponse,
    userId?: string,
  ): TaskEither<Error, ActivityResponse> {
    return pipe(
      this.activityService.getById(createResponse.activityId),
      TE.flatMap(() => this.responseQueries.create({ createResponse, userId })),
    );
  }

  updateResponse(
    updateResponse: UpdateActivityResponse,
    userId?: string,
  ): TaskEither<Error, ActivityResponse> {
    return this.responseQueries.update({ updateResponse, userId });
  }
}