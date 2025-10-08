import { inject, singleton } from "tsyringe";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { z } from "zod";
import { ActivityResponseQueries } from "./adapters/queries";
import { ActivityService } from "~/core/features/activities/service";
import { EventService } from "~/core/features/events/service";
import type {
  BaseActivityResponse,
  ActivityResponse,
  CreateActivityResponse,
  UpdateActivityResponse,
} from "~/core/features/responses/types";
import { extractUserResponse } from "~/core/features/responses/validators";
import { pipe } from "fp-ts/lib/function";

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
    return pipe(
      this.responseQueries.getByActivityId({ activityId }),
      TE.flatMap((responses) => {
        if (responses.length === 0) return TE.right([]);
        return pipe(
          this.activityService.getById(activityId),
          TE.flatMap((activity) => {
            // Validate activity type at runtime
            const activityTypeValidator = z.enum([
              "multiple-choice",
              "ranking",
              "free-response",
              "timer",
            ]);
            const validatedActivityType = activityTypeValidator.parse(
              activity.type,
            );

            const typedResponses: ActivityResponse[] = [];

            for (const response of responses) {
              const validationResult = extractUserResponse(
                validatedActivityType,
                response.response,
              );
              if (!validationResult.success) {
                return TE.left(
                  new Error(`Invalid response data: ${validationResult.error}`),
                );
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

            return TE.right(typedResponses);
          }),
        );
      }),
    );
  }

  getUserResponse(
    userId: string,
    activityId: number,
  ): TaskEither<Error, ActivityResponse | null> {
    return pipe(
      this.responseQueries.getByUserAndActivity({ userId, activityId }),
      TE.flatMap((response) => {
        if (!response) return TE.right(null);
        return pipe(
          this.activityService.getById(activityId),
          TE.flatMap((activity) => {
            // Validate activity type at runtime
            const activityTypeValidator = z.enum([
              "multiple-choice",
              "ranking",
              "free-response",
              "timer",
            ]);
            const validatedActivityType = activityTypeValidator.parse(
              activity.type,
            );

            const validationResult = extractUserResponse(
              validatedActivityType,
              response.response,
            );
            if (!validationResult.success) {
              return TE.left(
                new Error(`Invalid response data: ${validationResult.error}`),
              );
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

            return TE.right(typedResponse);
          }),
        );
      }),
    );
  }

  submitResponse(
    createResponse: CreateActivityResponse,
    userId: string,
  ): TaskEither<Error, BaseActivityResponse> {
    return pipe(
      this.activityService.getById(createResponse.activityId),
      TE.flatMap((activity) => {
        // Validate response data using Zod discriminated union
        const validationResult = extractUserResponse(
          activity.type,
          createResponse.response,
        );
        if (!validationResult.success) {
          return TE.left(
            new Error(`Invalid response data: ${validationResult.error}`),
          );
        }

        // Update the response with validated data
        const validatedResponse = {
          ...createResponse,
          response: validationResult.data,
        };

        return pipe(
          this.responseQueries.create({
            createResponse: validatedResponse,
            userId,
          }),
          TE.flatMap((response) =>
            pipe(
              this.eventService.getById(activity.eventId),
              TE.flatMap((_event) =>
                pipe(
                  TE.right(void 0), 
                  TE.map(() => response),
                ),
              ),
            ),
          ),
        );
      }),
    );
  }

  updateResponse(
    updateResponse: UpdateActivityResponse,
    userId?: string,
  ): TaskEither<Error, BaseActivityResponse> {
    return this.responseQueries.update({ updateResponse, userId });
  }
}
