import { inject, singleton } from "tsyringe";
import { ActivityQueries } from "./adapters/queries";
import { EventService } from "~/core/features/events/service";
import {
  PresenterService,
  PresenterServiceSymbol,
} from "~/core/features/presenter/service";
import { PresenterQueries } from "../presenter/adapters/queries";
import { ActivityResponseQueries } from "../responses/adapters/queries";
import { ActivityResultsService } from "~/core/features/activities/results-service";
import { ForbiddenError, NotFoundError } from "~/core/common/error";
import type {
  Activity,
  CreateActivity,
  UpdateActivity,
} from "~/core/features/activities/types";
import type { Event } from "~/core/features/events/types";
import type { ActivityData } from "~/core/features/presenter/types";
import type { ActivityResult } from "~/core/features/activities/results";

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

  async getByEventId(eventId: string): Promise<Activity[]> {
    return this.activityQueries.getByEventId({ eventId });
  }

  async getById(id: number): Promise<Activity | null> {
    return this.activityQueries.getById({ id });
  }

  async create(
    createActivity: CreateActivity,
    userId: string,
  ): Promise<Activity> {
    const event = await this.eventService.getById(createActivity.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    return this.activityQueries.create({ createActivity, userId });
  }

  async update(
    activityId: number,
    updateActivity: UpdateActivity,
    userId: string,
  ): Promise<Activity> {
    const originalActivity = await this.getById(activityId);
    if (!originalActivity) {
      throw new NotFoundError("Activity not found");
    }
    const event = await this.eventService.getById(originalActivity.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    const updatedActivity = await this.activityQueries.update({
      activityId,
      updateActivity,
      userId,
    });
    if (!updatedActivity) {
      throw new NotFoundError("Activity not updated");
    }
    await this.handleLiveActivityUpdate(originalActivity, updatedActivity);
    return updatedActivity;
  }

  async delete(activityId: number, userId: string): Promise<void> {
    const activity = await this.getById(activityId);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }
    const event = await this.eventService.getById(activity.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    await this.activityQueries.delete({ id: activityId, userId });
  }

  async reorder(activityIds: number[], userId: string): Promise<void> {
    if (activityIds.length === 0 || activityIds[0] === undefined) {
      throw new Error("No activities to reorder");
    }
    const activity = await this.getById(activityIds[0]);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }
    const event = await this.eventService.getById(activity.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    await this.activityQueries.reorder({ activityIds, userId });
  }

  private async handleLiveActivityUpdate(
    originalActivity: Activity,
    updatedActivity: Activity,
  ): Promise<void> {
    const presenterState = await this.presenterService.getByEventId(
      updatedActivity.eventId,
    );
    if (!presenterState) {
      return;
    }

    const isCurrentlyLive =
      presenterState.data &&
      "activityId" in presenterState.data &&
      presenterState.data.activityId === updatedActivity.id;

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
      return;
    }

    const shouldCleanupResponses = this.hasStructuralChanges(
      originalActivity,
      updatedActivity,
    );

    if (shouldCleanupResponses) {
      await this.cleanupInvalidResponses(updatedActivity.id);
    }

    const updatedActivityData =
      this.convertActivityToActivityData(updatedActivity);
    await this.updatePresenterStateDirectly(
      updatedActivity.eventId,
      updatedActivity.type,
      updatedActivityData,
    );
  }

  private hasStructuralChanges(
    originalActivity: Activity,
    updatedActivity: Activity,
  ): boolean {
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

    if (
      originalActivity.type === "free-response" &&
      updatedActivity.type === "free-response"
    ) {
      const originalData = originalActivity.data as { maxLength?: number };
      const updatedData = updatedActivity.data as { maxLength?: number };
      if (originalData.maxLength && updatedData.maxLength) {
        return updatedData.maxLength < originalData.maxLength;
      }
    }

    return false;
  }

  private async cleanupInvalidResponses(activityId: number): Promise<void> {
    await this.responseQueries.deleteByActivityId({ activityId });
  }

  private async updatePresenterStateDirectly(
    eventId: string,
    currentPage: string,
    data: ActivityData,
  ): Promise<void> {
    await this.presenterQueries.upsert({
      updateState: { eventId, currentPage, data },
    });
  }

  private convertActivityToActivityData(activity: Activity): ActivityData {
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
      default: {
        const baseData = { ...activity.data, activityId: activity.id };
        return baseData as ActivityData;
      }
    }
  }

  async getResults(
    activityId: number,
    userId: string,
  ): Promise<ActivityResult> {
    const activity = await this.getById(activityId);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }
    const event = await this.eventService.getById(activity.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    return this.resultsService.getResultsForActivity(activityId);
  }

  private checkEventAuthorization(event: Event, userId: string): void {
    if (event.creatorId !== userId) {
      throw new ForbiddenError(
        `User ${userId} is not authorized to manage activities for event ${event.id}`,
      );
    }
  }
}
