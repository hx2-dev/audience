import { eq } from "drizzle-orm";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { db, type SchemaConnection } from "~/adapters/db";
import { presenterStates } from "~/adapters/db/schema";
import { singleton } from "tsyringe";
import type {
  PresenterState,
  SerializedPresenterState,
  UpdatePresenterState,
} from "~/core/features/presenter/types";
import { activityDataValidator } from "~/core/features/presenter/types";
import type { UndefinedToNullable } from "~/lib/types";
import { NotFoundError } from "~/core/common/error";

export const PresenterQueriesSymbol = Symbol("PresenterQueries");

@singleton()
export class PresenterQueries {
  private rowToPresenterState(
    state: UndefinedToNullable<SerializedPresenterState>,
  ): PresenterState {
    let parsedData: PresenterState['data'];
    
    if (state.data) {
      try {
        const rawData: unknown = typeof state.data === 'string' 
          ? JSON.parse(state.data) 
          : state.data;
        
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
        parsedData = validationResult.success ? validationResult.data : undefined;
      } catch {
        parsedData = undefined;
      }
    } else {
      parsedData = undefined;
    }

    return {
      ...state,
      data: parsedData,
    };
  }

  getByEventId({
    eventId,
    connection = db,
  }: {
    eventId: number;
    connection?: SchemaConnection;
  }): TaskEither<Error, PresenterState> {
    return TE.tryCatch(
      async () => {
        const state = await connection.query.presenterStates.findFirst({
          where: eq(presenterStates.eventId, eventId),
        });

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
    connection = db,
  }: {
    updateState: UpdatePresenterState;
    connection?: SchemaConnection;
  }): TaskEither<Error, PresenterState> {
    return TE.tryCatch(
      async () => {
        const [state]: UndefinedToNullable<SerializedPresenterState>[] =
          await connection
            .insert(presenterStates)
            .values({
              eventId: updateState.eventId,
              currentPage: updateState.currentPage ?? "",
              data: updateState.data ? JSON.stringify(updateState.data) : null,
            })
            .onConflictDoUpdate({
              target: presenterStates.eventId,
              set: {
                currentPage:
                  updateState.currentPage ?? presenterStates.currentPage,
                data: updateState.data
                  ? JSON.stringify(updateState.data)
                  : presenterStates.data,
                updatedAt: new Date(),
              },
            })
            .returning()
            .execute();

        if (!state) {
          throw new NotFoundError("Presenter state not updated");
        }
        return this.rowToPresenterState(state);
      },
      (error) => error as Error,
    );
  }
}
