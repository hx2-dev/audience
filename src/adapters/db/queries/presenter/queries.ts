import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { singleton } from "tsyringe";
import { supabaseServiceClient } from "~/adapters/db/supabase";
import type { Tables, TablesInsert, Json } from "~/adapters/db/database.types";
import type {
  PresenterState,
  UpdatePresenterState,
} from "~/core/features/presenter/types";
import { activityDataValidator } from "~/core/features/presenter/types";
import { NotFoundError } from "~/core/common/error";

type PresenterStateRow = Tables<"hx2-audience_presenter_state">;
type PresenterStateInsert = TablesInsert<"hx2-audience_presenter_state">;

export const PresenterQueriesSymbol = Symbol("PresenterQueries");

@singleton()
export class PresenterQueries {
  private rowToPresenterState(state: PresenterStateRow): PresenterState {
    let parsedData: PresenterState["data"];

    if (state.data) {
      try {
        const rawData: unknown =
          typeof state.data === "string" ? JSON.parse(state.data) : state.data;

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
        parsedData = validationResult.success
          ? validationResult.data
          : undefined;
      } catch {
        parsedData = undefined;
      }
    } else {
      parsedData = undefined;
    }

    return {
      eventId: state.eventId,
      currentPage: state.currentPage,
      data: parsedData,
    };
  }

  getByEventId({
    eventId,
  }: {
    eventId: string;
  }): TaskEither<Error, PresenterState> {
    return TE.tryCatch(
      async () => {
        const { data: states, error } = await supabaseServiceClient
          .from("hx2-audience_presenter_state")
          .select("*")
          .eq("eventId", eventId);

        if (error) {
          throw new Error(error.message);
        }

        if (!states || states.length === 0) {
          throw new NotFoundError("Presenter state not found");
        }

        if (states.length > 1) {
          throw new Error(`Multiple presenter states found for event ${eventId}`);
        }

        const state = states[0];
        if (!state) {
          throw new NotFoundError("Presenter state not found");
        }

        return this.rowToPresenterState(state);
      },
      (error) => error as Error,
    );
  }

  upsert({
    updateState,
  }: {
    updateState: UpdatePresenterState;
  }): TaskEither<Error, PresenterState> {
    return TE.tryCatch(
      async () => {
        const stateData: PresenterStateInsert = {
          eventId: updateState.eventId,
          currentPage: updateState.currentPage ?? "",
          data: (updateState.data as unknown as Json) ?? null,
        };

        const { data: states, error } = await supabaseServiceClient
          .from("hx2-audience_presenter_state")
          .upsert(stateData, {
            onConflict: "eventId",
          })
          .select();

        if (error) {
          throw new Error(error.message);
        }

        if (!states || states.length === 0) {
          throw new NotFoundError("Presenter state not updated");
        }

        const state = states[0];
        if (!state) {
          throw new NotFoundError("Presenter state not updated");
        }

        return this.rowToPresenterState(state);
      },
      (error) => error as Error,
    );
  }
}
