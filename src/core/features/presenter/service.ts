import { inject, injectable } from "tsyringe";
import type { Event } from "~/core/features/events/types";
import {
  type PresenterQueries,
  PresenterQueriesSymbol,
} from "./adapters/queries";
import { EventService } from "~/core/features/events/service";
import { ForbiddenError, NotFoundError } from "~/core/common/error";
import type {
  PresenterState,
  UpdatePresenterState,
} from "~/core/features/presenter/types";

export const PresenterServiceSymbol = Symbol("PresenterService");

@injectable({ token: PresenterServiceSymbol })
export class PresenterService {
  constructor(
    @inject(PresenterQueriesSymbol)
    private readonly presenterQueries: PresenterQueries,
    @inject(EventService)
    private readonly eventService: EventService,
  ) {}

  async getByEventId(eventId: string): Promise<PresenterState | null> {
    return this.presenterQueries.getByEventId({ eventId });
  }

  async updateState(
    updateState: UpdatePresenterState,
    userId: string,
  ): Promise<PresenterState> {
    const event = await this.eventService.getById(updateState.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    return this.presenterQueries.upsert({ updateState });
  }

  private checkEventAuthorization(event: Event, userId: string): void {
    if (event.creatorId !== userId) {
      throw new ForbiddenError(
        `User ${userId} is not authorized to control event ${event.id}`,
      );
    }
  }
}
