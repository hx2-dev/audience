import { singleton } from "tsyringe";
import { supabaseServiceClient } from "~/core/adapters/db/supabase";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Json,
} from "~/core/adapters/db/database.types";
import type {
  Activity,
  CreateActivity,
  UpdateActivity,
} from "~/core/features/activities/types";
import {
  type ActivityData,
  activityDataValidator,
} from "~/core/features/presenter/types";

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

  async getByEventId({ eventId }: { eventId: string }): Promise<Activity[]> {
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
  }

  async getById({ id }: { id: number }): Promise<Activity | null> {
    const { data: activity, error } = await supabaseServiceClient
      .from("hx2-audience_activity")
      .select("*")
      .eq("id", id)
      .is("deleted", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(error.message);
    }

    if (!activity) {
      return null;
    }

    return this.rowToActivity(activity);
  }

  async create({
    createActivity,
    userId,
  }: {
    createActivity: CreateActivity;
    userId: string;
  }): Promise<Activity> {
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
      throw new Error("Activity not created");
    }

    return this.rowToActivity(activity);
  }

  async update({
    activityId,
    updateActivity,
    userId,
  }: {
    activityId: number;
    updateActivity: UpdateActivity;
    userId: string;
  }): Promise<Activity | null> {
    const serializedData = updateActivity.data
      ? (() => {
          const data = updateActivity.data;
          if (
            data &&
            typeof data === "object" &&
            "type" in data &&
            data.type === "timer" &&
            "startedAt" in data &&
            data.startedAt instanceof Date
          ) {
            return { ...data, startedAt: data.startedAt.toISOString() };
          }
          return data;
        })()
      : undefined;

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
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(error.message);
    }

    if (!activity) {
      return null;
    }

    return this.rowToActivity(activity);
  }

  async delete({ id, userId }: { id: number; userId: string }): Promise<void> {
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
  }

  async reorder({
    activityIds,
    userId,
  }: {
    activityIds: number[];
    userId: string;
  }): Promise<void> {
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
  }
}
