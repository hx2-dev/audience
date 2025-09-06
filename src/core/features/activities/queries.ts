import { and, eq, isNull } from "drizzle-orm";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { type SchemaConnection, db } from "~/adapters/db";
import { activities } from "~/adapters/db/schema";
import { singleton } from "tsyringe";
import type { Activity, CreateActivity, UpdateActivity } from "~/core/features/activities/types";
import { type ActivityData, activityDataValidator } from "~/core/features/presenter/types";
import { NotFoundError } from "~/core/common/error";

@singleton()
export class ActivityQueries {
  private rowToActivity(activity: {
    id: number;
    eventId: string;
    name: string;
    type: string;
    data: unknown;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
    deleted: Date | null;
  }): Activity {
    let parsedData: ActivityData;
    try {
      const rawData: unknown = typeof activity.data === 'string' 
        ? JSON.parse(activity.data) 
        : activity.data;
      
      // Transform date strings back to Date objects for timer activities
      if (rawData && 
          typeof rawData === 'object' && 
          'type' in rawData && 
          rawData.type === 'timer' && 
          'startedAt' in rawData &&
          typeof rawData.startedAt === 'string') {
        (rawData as { startedAt: Date }).startedAt = new Date(rawData.startedAt);
      }
      
      // Validate and parse using Zod
      const validationResult = activityDataValidator.safeParse(rawData);
      if (validationResult.success) {
        parsedData = validationResult.data;
      } else {
        // Fallback to a default welcome activity
        parsedData = {
          type: "welcome",
          title: "Invalid Activity Data"
        };
      }
    } catch {
      // Fallback - try to parse as is, or default to welcome
      const fallbackResult = activityDataValidator.safeParse(activity.data);
      parsedData = fallbackResult.success ? fallbackResult.data : {
        type: "welcome",
        title: "Invalid Activity Data"
      };
    }

    return {
      id: activity.id,
      eventId: activity.eventId,
      name: activity.name,
      type: activity.type,
      data: parsedData,
      order: activity.order,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      updatedBy: activity.updatedBy,
      deleted: activity.deleted,
    };
  }

  getByEventId({
    eventId,
    connection = db,
  }: {
    eventId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Activity[]> {
    return TE.tryCatch(
      async () => {
        const results = await connection.query.activities.findMany({
          where: and(eq(activities.eventId, eventId), isNull(activities.deleted)),
          orderBy: (activities, { asc }) => [asc(activities.order), asc(activities.createdAt)],
        });

        return results.map((activity) => this.rowToActivity(activity));
      },
      (error) => error as Error,
    );
  }

  getById({
    id,
    connection = db,
  }: {
    id: number;
    connection?: SchemaConnection;
  }): TaskEither<Error, Activity> {
    return TE.tryCatch(
      async () => {
        const activity = await connection.query.activities.findFirst({
          where: and(eq(activities.id, id), isNull(activities.deleted)),
        });

        if (!activity) {
          throw new NotFoundError("Activity not found");
        }
        return this.rowToActivity(activity);
      },
      (error) => error as Error,
    );
  }

  create({
    createActivity,
    userId,
    connection = db,
  }: {
    createActivity: CreateActivity;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Activity> {
    return TE.tryCatch(
      async () => {
        const [activity] = await connection
          .insert(activities)
          .values({ 
            ...createActivity, 
            data: JSON.stringify(createActivity.data),
            updatedBy: userId 
          })
          .returning()
          .execute();

        if (!activity) {
          throw new NotFoundError("Activity not created");
        }
        return this.rowToActivity(activity);
      },
      (error) => error as Error,
    );
  }

  update({
    activityId,
    updateActivity,
    userId,
    connection = db,
  }: {
    activityId: number;
    updateActivity: UpdateActivity;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Activity> {
    return TE.tryCatch(
      async () => {
        const updateData = {
          ...updateActivity,
          data: updateActivity.data ? JSON.stringify(updateActivity.data) : undefined,
          updatedBy: userId,
        };
        
        const [activity] = await connection
          .update(activities)
          .set(updateData)
          .where(and(eq(activities.id, activityId), isNull(activities.deleted)))
          .returning()
          .execute();

        if (!activity) {
          throw new NotFoundError("Activity not updated");
        }
        return this.rowToActivity(activity);
      },
      (error) => error as Error,
    );
  }

  delete({
    id,
    userId,
    connection = db,
  }: {
    id: number;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, void> {
    return TE.tryCatch(
      async () => {
        await connection
          .update(activities)
          .set({ deleted: new Date(), updatedBy: userId })
          .where(and(eq(activities.id, id), isNull(activities.deleted)))
          .execute();
      },
      (error) => error as Error,
    );
  }

  reorder({
    activityIds,
    userId,
    connection = db,
  }: {
    activityIds: number[];
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, void> {
    return TE.tryCatch(
      async () => {
        // Update the order of activities based on their position in the array
        for (let i = 0; i < activityIds.length; i++) {
          const activityId = activityIds[i];
          if (activityId !== undefined) {
            await connection
              .update(activities)
              .set({ order: i, updatedBy: userId })
              .where(and(eq(activities.id, activityId), isNull(activities.deleted)))
              .execute();
          }
        }
      },
      (error) => error as Error,
    );
  }
}