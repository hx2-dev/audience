import { inject, singleton } from "tsyringe";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { ActivityQueries } from "~/adapters/db/queries/activities/queries";
import { EventService } from "~/core/features/events/service";
import {
  PresenterService,
  PresenterServiceSymbol,
} from "~/core/features/presenter/service";
import { PresenterQueries } from "~/adapters/db/queries/presenter/queries";
import { ActivityResponseQueries } from "~/adapters/db/queries/responses/queries";
import { ActivityResultsService } from "~/core/features/activities/results-service";
import { ForbiddenError } from "~/core/common/error";
import type {
  Activity,
  CreateActivity,
  UpdateActivity,
} from "~/core/features/activities/types";
import type { Event } from "~/core/features/events/types";
import type { ActivityData } from "~/core/features/presenter/types";
import type { ActivityResult } from "~/core/features/activities/results";
import { pipe } from "fp-ts/lib/function";

@singleton()
export class ActivityService {
  constructor(
    @inject(ActivityQueries)
    private readonly activityQueries: ActivityQueries,
    @inject(EventService)
    private readonly eventService: EventService,
    @inject(PresenterServiceSymbol)
    private readonly presenterService: PresenterService,
    @inject(PresenterQueries)
    private readonly presenterQueries: PresenterQueries,
    @inject(ActivityResponseQueries)
    private readonly responseQueries: ActivityResponseQueries,
    @inject(ActivityResultsService)
    private readonly resultsService: ActivityResultsService,
  ) {}

  getByEventId(eventId: string): TaskEither<Error, Activity[]> {
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
      TE.flatMap((originalActivity) =>
        pipe(
          this.eventService.getById(originalActivity.eventId),
          TE.flatMap(this.checkEventAuthorization(userId)),
          TE.flatMap(() =>
            this.activityQueries.update({ activityId, updateActivity, userId }),
          ),
          TE.flatMap((updatedActivity) =>
            pipe(
              this.handleLiveActivityUpdate(originalActivity, updatedActivity),
              TE.map(() => updatedActivity),
            ),
          ),
        ),
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
      activityIds.length > 0 && activityIds[0] !== undefined
        ? this.getById(activityIds[0])
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

  private handleLiveActivityUpdate(
    originalActivity: Activity,
    updatedActivity: Activity,
  ): TaskEither<Error, void> {
    return pipe(
      this.presenterService.getByEventId(updatedActivity.eventId),
      TE.flatMap((presenterState) => {
        // Check if this activity is currently being presented
        const isCurrentlyLive =
          presenterState.data &&
          "activityId" in presenterState.data &&
          presenterState.data.activityId === updatedActivity.id;

        // For non-response activities, also check if the type matches and there's no activityId
        // This handles activities that were started before we added proper activityId tracking
        const isLegacyLiveActivity =
          !isCurrentlyLive &&
          presenterState.data?.type === updatedActivity.type &&
          !(
            presenterState.data &&
            "activityId" in presenterState.data &&
            presenterState.data.activityId
          ) &&
          ["markdown", "iframe", "welcome", "break", "thank-you"].includes(
            updatedActivity.type,
          );

        if (!isCurrentlyLive || isLegacyLiveActivity) {
          return TE.right(void 0);
        }

        // Check if the activity structure changed significantly
        const shouldCleanupResponses = this.hasStructuralChanges(
          originalActivity,
          updatedActivity,
        );

        return pipe(
          // Clean up responses if needed
          shouldCleanupResponses
            ? this.cleanupInvalidResponses(updatedActivity.id, presenterState)
            : TE.right(void 0),
          TE.flatMap(() => {
            // Update the presenter state with new activity data
            const updatedActivityData =
              this.convertActivityToActivityData(updatedActivity);
            return this.updatePresenterStateDirectly(
              updatedActivity.eventId,
              updatedActivity.type,
              updatedActivityData,
            );
          }),
          TE.map(() => void 0),
        );
      }),
    );
  }

  private hasStructuralChanges(
    originalActivity: Activity,
    updatedActivity: Activity,
  ): boolean {
    // For multiple choice questions, check if options changed
    if (
      originalActivity.type === "multiple-choice" &&
      updatedActivity.type === "multiple-choice"
    ) {
      const originalData = originalActivity.data as { options: string[] };
      const updatedData = updatedActivity.data as { options: string[] };
      return (
        JSON.stringify(originalData.options) !==
        JSON.stringify(updatedData.options)
      );
    }

    // For ranking questions, check if items changed
    if (
      originalActivity.type === "ranking" &&
      updatedActivity.type === "ranking"
    ) {
      const originalData = originalActivity.data as { items: string[] };
      const updatedData = updatedActivity.data as { items: string[] };
      return (
        JSON.stringify(originalData.items) !== JSON.stringify(updatedData.items)
      );
    }

    // For free response, check if max length constraints changed significantly
    if (
      originalActivity.type === "free-response" &&
      updatedActivity.type === "free-response"
    ) {
      const originalData = originalActivity.data as { maxLength?: number };
      const updatedData = updatedActivity.data as { maxLength?: number };
      // Only cleanup if max length was reduced significantly
      if (originalData.maxLength && updatedData.maxLength) {
        return updatedData.maxLength < originalData.maxLength;
      }
    }

    return false;
  }

  private cleanupInvalidResponses(
    activityId: number,
    presenterState: { eventId: string },
  ): TaskEither<Error, void> {
    return pipe(
      // Delete all responses for this activity when structure changes significantly
      this.responseQueries.deleteByActivityId({ activityId }),
      TE.flatMap(() => {
        // Broadcast activity responses update to notify presenter views
        return pipe(
          this.eventService.getById(presenterState.eventId),
          TE.flatMap((event) => {
            const shortId = event.shortId;
            if (shortId) {
              return TE.right(void 0); // Broadcasting replaced with Supabase Realtime
            }
            return TE.right(void 0);
          }),
        );
      }),
    );
  }

  private updatePresenterStateDirectly(
    eventId: string,
    currentPage: string,
    data: ActivityData,
  ): TaskEither<Error, void> {
    return pipe(
      this.eventService.getById(eventId),
      TE.flatMap((event) => {
        // Directly use the presenter queries to bypass authorization
        // since we've already authorized the user in the main update method
        return pipe(
          this.presenterQueries.upsert({
            updateState: { eventId, currentPage, data },
          }),
          TE.flatMap(() => {
            // Broadcast the state change
            const shortId = event.shortId;
            if (shortId) {
              return TE.right(void 0); // Broadcasting replaced with Supabase Realtime
            }
            return TE.right(void 0);
          }),
          TE.map(() => void 0),
        );
      }),
    );
  }

  private convertActivityToActivityData(activity: Activity): ActivityData {
    // Convert stored activity data to presenter activity data format
    const baseData = { ...activity.data, activityId: activity.id };

    switch (activity.type) {
      case "multiple-choice": {
        const data = activity.data as {
          question: string;
          options: string[];
          allowMultiple: boolean;
        };
        return {
          type: "multiple-choice",
          question: data.question,
          options: data.options,
          allowMultiple: data.allowMultiple,
          activityId: activity.id,
        };
      }
      case "free-response": {
        const data = activity.data as {
          question: string;
          placeholder?: string;
          maxLength?: number;
        };
        return {
          type: "free-response",
          question: data.question,
          placeholder: data.placeholder,
          maxLength: data.maxLength,
          activityId: activity.id,
        };
      }
      case "ranking": {
        const data = activity.data as { question: string; items: string[] };
        return {
          type: "ranking",
          question: data.question,
          items: data.items,
          activityId: activity.id,
        };
      }
      case "markdown": {
        const data = activity.data as { title?: string; content: string };
        return {
          type: "markdown",
          title: data.title,
          content: data.content,
        };
      }
      case "iframe": {
        const data = activity.data as {
          title: string;
          url: string;
          description?: string;
        };
        return {
          type: "iframe",
          title: data.title,
          url: data.url,
          description: data.description,
        };
      }
      case "timer": {
        const data = activity.data as {
          durationMs: number;
          startedAt: Date;
          title?: string;
        };
        return {
          type: "timer",
          durationMs: data.durationMs,
          startedAt: data.startedAt,
          title: data.title,
        };
      }
      case "welcome": {
        const data = activity.data as { title?: string; subtitle?: string };
        return {
          type: "welcome",
          title: data.title,
          subtitle: data.subtitle,
        };
      }
      case "break": {
        const data = activity.data as { message?: string; duration?: number };
        return {
          type: "break",
          message: data.message,
          duration: data.duration,
        };
      }
      case "thank-you": {
        const data = activity.data as { message?: string };
        return {
          type: "thank-you",
          message: data.message,
        };
      }
      default:
        return baseData as ActivityData;
    }
  }

  getResults(
    activityId: number,
    userId: string,
  ): TaskEither<Error, ActivityResult> {
    return pipe(
      this.getById(activityId),
      TE.flatMap((activity) =>
        pipe(
          this.eventService.getById(activity.eventId),
          TE.flatMap(this.checkEventAuthorization(userId)),
          TE.flatMap(() =>
            this.resultsService.getResultsForActivity(activityId),
          ),
        ),
      ),
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
