import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { singleton } from "tsyringe";
import { supabaseServiceClient } from "~/adapters/db/supabase";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Json,
} from "~/adapters/db/database.types";
import type {
  Activity,
  CreateActivity,
  UpdateActivity,
} from "~/core/features/activities/types";
import {
  type ActivityData,
  activityDataValidator,
} from "~/core/features/presenter/types";
import { NotFoundError } from "~/core/common/error";

type ActivityRow = Tables<"hx2-audience_activity">;
type ActivityInsert = TablesInsert<"hx2-audience_activity">;
type ActivityUpdate = TablesUpdate<"hx2-audience_activity">;

@singleton()
export class ActivityQueries {
  private rowToActivity(activity: ActivityRow): Activity {
    let parsedData: ActivityData;
    try {
      const rawData: unknown =
        typeof activity.data === "string"
          ? JSON.parse(activity.data)
          : activity.data;

      // Transform date strings back to Date objects for timer activities
      if (
        rawData &&
        typeof rawData === "object" &&
        "type" in rawData &&
        rawData.type === "timer" &&
        "startedAt" in rawData &&
        typeof rawData.startedAt === "string"
      ) {
        (rawData as { startedAt: Date }).startedAt = new Date(
          rawData.startedAt,
        );
      }

      // Validate and parse using Zod
      const validationResult = activityDataValidator.safeParse(rawData);
      if (validationResult.success) {
        parsedData = validationResult.data;
      } else {
        // Fallback to a default welcome activity
        parsedData = {
          type: "welcome",
          title: "Invalid Activity Data",
        };
      }
    } catch {
      // Fallback - try to parse as is, or default to welcome
      const fallbackResult = activityDataValidator.safeParse(activity.data);
      parsedData = fallbackResult.success
        ? fallbackResult.data
        : {
            type: "welcome",
            title: "Invalid Activity Data",
          };
    }

    return {
      id: activity.id,
      eventId: activity.eventId,
      name: activity.name,
      type: activity.type,
      data: parsedData,
      order: activity.order,
      createdAt: new Date(activity.createdAt),
      updatedAt: new Date(activity.updatedAt),
      updatedBy: activity.updatedBy,
      deleted: activity.deleted ? new Date(activity.deleted) : null,
    };
  }

  getByEventId({
    eventId,
  }: {
    eventId: string;
  }): TaskEither<Error, Activity[]> {
    return TE.tryCatch(
      async () => {
        const { data: activities, error } = await supabaseServiceClient
          .from("hx2-audience_activity")
          .select("*")
          .eq("eventId", eventId)
          .is("deleted", null)
          .order("order", { ascending: true })
          .order("createdAt", { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        return activities.map((activity) => this.rowToActivity(activity));
      },
      (error) => error as Error,
    );
  }

  getById({ id }: { id: number }): TaskEither<Error, Activity> {
    return TE.tryCatch(
      async () => {
        const { data: activity, error } = await supabaseServiceClient
          .from("hx2-audience_activity")
          .select("*")
          .eq("id", id)
          .is("deleted", null)
          .single();

        if (error) {
          throw new Error(error.message);
        }

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
  }: {
    createActivity: CreateActivity;
    userId: string;
  }): TaskEither<Error, Activity> {
    return TE.tryCatch(
      async () => {
        const activityData: ActivityInsert = {
          eventId: createActivity.eventId,
          name: createActivity.name,
          type: createActivity.type,
          data: createActivity.data as unknown as Json,
          order: createActivity.order ?? 0,
          updatedBy: userId,
        };

        const { data: activity, error } = await supabaseServiceClient
          .from("hx2-audience_activity")
          .insert(activityData)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

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
  }: {
    activityId: number;
    updateActivity: UpdateActivity;
    userId: string;
  }): TaskEither<Error, Activity> {
    return TE.tryCatch(
      async () => {
        const serializedData = updateActivity.data ? (() => {
          const data = updateActivity.data;
          if (data && typeof data === 'object' && 'type' in data && data.type === 'timer' && 'startedAt' in data && data.startedAt instanceof Date) {
            return { ...data, startedAt: data.startedAt.toISOString() };
          }
          return data;
        })() : undefined;

        const updateData: ActivityUpdate = {
          ...updateActivity,
          data: serializedData as Json,
          updatedBy: userId,
        };

        const { data: activity, error } = await supabaseServiceClient
          .from("hx2-audience_activity")
          .update(updateData)
          .eq("id", activityId)
          .is("deleted", null)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

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
  }: {
    id: number;
    userId: string;
  }): TaskEither<Error, void> {
    return TE.tryCatch(
      async () => {
        const { error } = await supabaseServiceClient
          .from("hx2-audience_activity")
          .update({
            deleted: new Date().toISOString(),
            updatedBy: userId,
          })
          .eq("id", id)
          .is("deleted", null);

        if (error) {
          throw new Error(error.message);
        }
      },
      (error) => error as Error,
    );
  }

  reorder({
    activityIds,
    userId,
  }: {
    activityIds: number[];
    userId: string;
  }): TaskEither<Error, void> {
    return TE.tryCatch(
      async () => {
        // Update the order of activities based on their position in the array
        for (let i = 0; i < activityIds.length; i++) {
          const activityId = activityIds[i];
          if (activityId !== undefined) {
            const { error } = await supabaseServiceClient
              .from("hx2-audience_activity")
              .update({
                order: i,
                updatedBy: userId,
              })
              .eq("id", activityId)
              .is("deleted", null);

            if (error) {
              throw error;
            }
          }
        }
      },
      (error) => error as Error,
    );
  }
}
