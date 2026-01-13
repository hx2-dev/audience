import { injectable } from "tsyringe";
import type { PresenterState, UpdatePresenterState } from "../types";

@injectable()
export class MockPresenterQueries {
  private states = new Map<string, PresenterState>();

  async getByEventId({
    eventId,
  }: {
    eventId: string;
  }): Promise<PresenterState | null> {
    return this.states.get(eventId) ?? null;
  }

  async upsert({
    updateState,
  }: {
    updateState: UpdatePresenterState;
  }): Promise<PresenterState> {
    const state: PresenterState = {
      eventId: updateState.eventId,
      currentPage: updateState.currentPage,
      data: updateState.data,
    };
    this.states.set(updateState.eventId, state);
    return state;
  }

  seed(states: PresenterState[]): void {
    for (const state of states) {
      this.states.set(state.eventId, state);
    }
  }

  reset(): void {
    this.states.clear();
  }

  getAll(): PresenterState[] {
    return Array.from(this.states.values());
  }
}
