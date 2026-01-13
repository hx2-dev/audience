import { singleton } from "tsyringe";
import { supabaseServiceClient } from "~/core/adapters/db/supabase";
import type {
  Tables,
  TablesInsert,
  Json,
} from "~/core/adapters/db/database.types";
import type {
  BaseActivityResponse,
  CreateActivityResponse,
  UpdateActivityResponse,
} from "~/core/features/responses/types";

type ActivityResponseRow = Tables<"hx2-audience_activity_response">;
type ActivityResponseInsert = TablesInsert<"hx2-audience_activity_response">;

@singleton()
export class ActivityResponseQueries {
  private rowToResponse(response: ActivityResponseRow): BaseActivityResponse {
    return {
      id: response.id,
      activityId: response.activityId,
      userId: response.userId,
      response: response.response,
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
    };
  }

  async getByActivityId({
    activityId,
  }: {
    activityId: number;
  }): Promise<BaseActivityResponse[]> {
    const { data: responses, error } = await supabaseServiceClient
      .from("hx2-audience_activity_response")
      .select("*")
      .eq("activityId", activityId)
      .order("createdAt", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return responses.map((response) => this.rowToResponse(response));
  }

  async getByUserAndActivity({
    userId,
    activityId,
  }: {
    userId: string;
    activityId: number;
  }): Promise<BaseActivityResponse | null> {
    const { data: response, error } = await supabaseServiceClient
      .from("hx2-audience_activity_response")
      .select("*")
      .eq("userId", userId)
      .eq("activityId", activityId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return response ? this.rowToResponse(response) : null;
  }

  async create({
    createResponse,
    userId,
  }: {
    createResponse: CreateActivityResponse;
    userId: string;
  }): Promise<BaseActivityResponse> {
    const responseData: ActivityResponseInsert = {
      activityId: createResponse.activityId,
      userId,
      response: createResponse.response as Json,
    };

    const { data: response, error } = await supabaseServiceClient
      .from("hx2-audience_activity_response")
      .upsert(responseData, {
        onConflict: "userId,activityId",
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!response) {
      throw new Error("Response not created/updated");
    }

    return this.rowToResponse(response);
  }

  async update({
    updateResponse,
    userId,
  }: {
    updateResponse: UpdateActivityResponse;
    userId?: string;
  }): Promise<BaseActivityResponse | null> {
    let query = supabaseServiceClient
      .from("hx2-audience_activity_response")
      .update({
        response: updateResponse.response as Json,
      })
      .eq("id", updateResponse.id);

    if (userId) {
      query = query.eq("userId", userId);
    }

    const { data: response, error } = await query.select().single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(error.message);
    }

    if (!response) {
      return null;
    }

    return this.rowToResponse(response);
  }

  async deleteByActivityId({
    activityId,
  }: {
    activityId: number;
  }): Promise<void> {
    const { error } = await supabaseServiceClient
      .from("hx2-audience_activity_response")
      .delete()
      .eq("activityId", activityId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
