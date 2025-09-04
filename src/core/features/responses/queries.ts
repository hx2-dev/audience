import { and, eq } from "drizzle-orm";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { db, type SchemaConnection } from "~/adapters/db";
import { activityResponses } from "~/adapters/db/schema";
import { singleton } from "tsyringe";
import type { ActivityResponse, CreateActivityResponse, UpdateActivityResponse } from "~/core/features/responses/types";
import { NotFoundError } from "~/core/common/error";

@singleton()
export class ActivityResponseQueries {
  private rowToResponse(response: {
    id: number;
    activityId: number;
    userId: string | null;
    response: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): ActivityResponse {
    return {
      id: response.id,
      activityId: response.activityId,
      userId: response.userId,
      response: response.response,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  }

  getByActivityId({
    activityId,
    connection = db,
  }: {
    activityId: number;
    connection?: SchemaConnection;
  }): TaskEither<Error, ActivityResponse[]> {
    return TE.tryCatch(
      async () => {
        const results = await connection.query.activityResponses.findMany({
          where: eq(activityResponses.activityId, activityId),
          orderBy: (activityResponses, { asc }) => [asc(activityResponses.createdAt)],
        });

        return results.map((response) => this.rowToResponse(response));
      },
      (error) => error as Error,
    );
  }

  getByUserAndActivity({
    userId,
    activityId,
    connection = db,
  }: {
    userId: string;
    activityId: number;
    connection?: SchemaConnection;
  }): TaskEither<Error, ActivityResponse | null> {
    return TE.tryCatch(
      async () => {
        const response = await connection.query.activityResponses.findFirst({
          where: and(
            eq(activityResponses.userId, userId),
            eq(activityResponses.activityId, activityId)
          ),
        });

        return response ? this.rowToResponse(response) : null;
      },
      (error) => error as Error,
    );
  }

  create({
    createResponse,
    userId,
    connection = db,
  }: {
    createResponse: CreateActivityResponse;
    userId?: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, ActivityResponse> {
    return TE.tryCatch(
      async () => {
        const [response] = await connection
          .insert(activityResponses)
          .values({ 
            ...createResponse,
            userId,
            response: JSON.stringify(createResponse.response),
          })
          .onConflictDoUpdate({
            target: [activityResponses.userId, activityResponses.activityId],
            set: {
              response: JSON.stringify(createResponse.response),
              updatedAt: new Date(),
            },
          })
          .returning()
          .execute();

        if (!response) {
          throw new NotFoundError("Response not created/updated");
        }
        return this.rowToResponse(response);
      },
      (error) => error as Error,
    );
  }

  update({
    updateResponse,
    userId,
    connection = db,
  }: {
    updateResponse: UpdateActivityResponse;
    userId?: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, ActivityResponse> {
    return TE.tryCatch(
      async () => {
        const [response] = await connection
          .update(activityResponses)
          .set({
            response: JSON.stringify(updateResponse.response),
          })
          .where(and(
            eq(activityResponses.id, updateResponse.id),
            userId ? eq(activityResponses.userId, userId) : undefined
          ))
          .returning()
          .execute();

        if (!response) {
          throw new NotFoundError("Response not updated");
        }
        return this.rowToResponse(response);
      },
      (error) => error as Error,
    );
  }
}