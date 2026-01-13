import { inject, singleton } from "tsyringe";
import { z } from "zod";
import { ActivityResponseQueries } from "./adapters/queries";
import { ActivityService } from "~/core/features/activities/service";
import { EventService } from "~/core/features/events/service";
import { NotFoundError } from "~/core/common/error";
import type {
  BaseActivityResponse,
  ActivityResponse,
  CreateActivityResponse,
  UpdateActivityResponse,
} from "~/core/features/responses/types";
import { extractUserResponse } from "~/core/features/responses/validators";

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

  async getByActivityId(activityId: number): Promise<ActivityResponse[]> {
    const responses = await this.responseQueries.getByActivityId({
      activityId,
    });
    if (responses.length === 0) return [];

    const activity = await this.activityService.getById(activityId);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }

    const activityTypeValidator = z.enum([
      "multiple-choice",
      "ranking",
      "free-response",
      "timer",
    ]);
    const validatedActivityType = activityTypeValidator.parse(activity.type);

    const typedResponses: ActivityResponse[] = [];

    for (const response of responses) {
      const validationResult = extractUserResponse(
        validatedActivityType,
        response.response,
      );
      if (!validationResult.success) {
        throw new Error(`Invalid response data: ${validationResult.error}`);
      }

      const responseData = (() => {
        switch (validatedActivityType) {
          case "multiple-choice":
            return {
              activityType: "multiple-choice" as const,
              responses: validationResult.data as string[],
            };
          case "ranking":
            return {
              activityType: "ranking" as const,
              responses: validationResult.data as string[],
            };
          case "free-response":
            return {
              activityType: "free-response" as const,
              responses: validationResult.data as string,
            };
          case "timer":
            return {
              activityType: "timer" as const,
              responses: validationResult.data as string | undefined,
            };
        }
      })();

      typedResponses.push({
        id: response.id,
        activityId: response.activityId,
        userId: response.userId,
        activityType: validatedActivityType,
        response: responseData,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      } satisfies ActivityResponse);
    }

    return typedResponses;
  }

  async getUserResponse(
    userId: string,
    activityId: number,
  ): Promise<ActivityResponse | null> {
    const response = await this.responseQueries.getByUserAndActivity({
      userId,
      activityId,
    });
    if (!response) return null;

    const activity = await this.activityService.getById(activityId);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }

    const activityTypeValidator = z.enum([
      "multiple-choice",
      "ranking",
      "free-response",
      "timer",
    ]);
    const validatedActivityType = activityTypeValidator.parse(activity.type);

    const validationResult = extractUserResponse(
      validatedActivityType,
      response.response,
    );
    if (!validationResult.success) {
      throw new Error(`Invalid response data: ${validationResult.error}`);
    }

    const responseData = (() => {
      switch (validatedActivityType) {
        case "multiple-choice":
          return {
            activityType: "multiple-choice" as const,
            responses: validationResult.data as string[],
          };
        case "ranking":
          return {
            activityType: "ranking" as const,
            responses: validationResult.data as string[],
          };
        case "free-response":
          return {
            activityType: "free-response" as const,
            responses: validationResult.data as string,
          };
        case "timer":
          return {
            activityType: "timer" as const,
            responses: validationResult.data as string | undefined,
          };
      }
    })();

    const typedResponse: ActivityResponse = {
      id: response.id,
      activityId: response.activityId,
      userId: response.userId,
      activityType: validatedActivityType,
      response: responseData,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    } satisfies ActivityResponse;

    return typedResponse;
  }

  async submitResponse(
    createResponse: CreateActivityResponse,
    userId: string,
  ): Promise<BaseActivityResponse> {
    const activity = await this.activityService.getById(
      createResponse.activityId,
    );
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }

    const validationResult = extractUserResponse(
      activity.type,
      createResponse.response,
    );
    if (!validationResult.success) {
      throw new Error(`Invalid response data: ${validationResult.error}`);
    }

    const validatedResponse = {
      ...createResponse,
      response: validationResult.data,
    };

    return this.responseQueries.create({
      createResponse: validatedResponse,
      userId,
    });
  }

  async updateResponse(
    updateResponse: UpdateActivityResponse,
    userId?: string,
  ): Promise<BaseActivityResponse> {
    const response = await this.responseQueries.update({
      updateResponse,
      userId,
    });
    if (!response) {
      throw new NotFoundError("Response not found");
    }
    return response;
  }
}
