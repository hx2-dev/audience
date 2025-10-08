import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
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
import { NotFoundError } from "~/core/common/error";

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

  getByActivityId({
    activityId,
  }: {
    activityId: number;
  }): TaskEither<Error, BaseActivityResponse[]> {
    return TE.tryCatch(
      async () => {
        const { data: responses, error } = await supabaseServiceClient
          .from("hx2-audience_activity_response")
          .select("*")
          .eq("activityId", activityId)
          .order("createdAt", { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        return responses.map((response) => this.rowToResponse(response));
      },
      (error) => error as Error,
    );
  }

  getByUserAndActivity({
    userId,
    activityId,
  }: {
    userId: string;
    activityId: number;
  }): TaskEither<Error, BaseActivityResponse | null> {
    return TE.tryCatch(
      async () => {
        const { data: response, error } = await supabaseServiceClient
          .from("hx2-audience_activity_response")
          .select("*")
          .eq("userId", userId)
          .eq("activityId", activityId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // No rows returned
            return null;
          }
          throw error;
        }

        return response ? this.rowToResponse(response) : null;
      },
      (error) => error as Error,
    );
  }

  create({
    createResponse,
    userId,
  }: {
    createResponse: CreateActivityResponse;
    userId: string;
  }): TaskEither<Error, BaseActivityResponse> {
    return TE.tryCatch(
      async () => {
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
  }: {
    updateResponse: UpdateActivityResponse;
    userId?: string;
  }): TaskEither<Error, BaseActivityResponse> {
    return TE.tryCatch(
      async () => {
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
          throw new Error(error.message);
        }

        if (!response) {
          throw new NotFoundError("Response not updated");
        }

        return this.rowToResponse(response);
      },
      (error) => error as Error,
    );
  }

  deleteByActivityId({
    activityId,
  }: {
    activityId: number;
  }): TaskEither<Error, void> {
    return TE.tryCatch(
      async () => {
        const { error } = await supabaseServiceClient
          .from("hx2-audience_activity_response")
          .delete()
          .eq("activityId", activityId);

        if (error) {
          throw new Error(error.message);
        }
      },
      (error) => error as Error,
    );
  }
}
