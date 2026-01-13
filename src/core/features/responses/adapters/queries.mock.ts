import { injectable } from "tsyringe";
import type {
  BaseActivityResponse,
  CreateActivityResponse,
  UpdateActivityResponse,
} from "../types";

@injectable()
export class MockActivityResponseQueries {
  private responses = new Map<number, BaseActivityResponse>();
  private nextId = 1;

  async getByActivityId({
    activityId,
  }: {
    activityId: number;
  }): Promise<BaseActivityResponse[]> {
    return Array.from(this.responses.values())
      .filter((r) => r.activityId === activityId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getByUserAndActivity({
    userId,
    activityId,
  }: {
    userId: string;
    activityId: number;
  }): Promise<BaseActivityResponse | null> {
    const response = Array.from(this.responses.values()).find(
      (r) => r.userId === userId && r.activityId === activityId,
    );
    return response ?? null;
  }

  async create({
    createResponse,
    userId,
  }: {
    createResponse: CreateActivityResponse;
    userId: string;
  }): Promise<BaseActivityResponse> {
    const existing = Array.from(this.responses.values()).find(
      (r) => r.userId === userId && r.activityId === createResponse.activityId,
    );

    if (existing) {
      const updated: BaseActivityResponse = {
        ...existing,
        response: createResponse.response,
        updatedAt: new Date(),
      };
      this.responses.set(existing.id, updated);
      return updated;
    }

    const now = new Date();
    const response: BaseActivityResponse = {
      id: this.nextId++,
      activityId: createResponse.activityId,
      userId,
      response: createResponse.response,
      createdAt: now,
      updatedAt: now,
    };
    this.responses.set(response.id, response);
    return response;
  }

  async update({
    updateResponse,
    userId,
  }: {
    updateResponse: UpdateActivityResponse;
    userId?: string;
  }): Promise<BaseActivityResponse | null> {
    const response = this.responses.get(updateResponse.id);
    if (!response) {
      return null;
    }
    if (userId && response.userId !== userId) {
      return null;
    }
    const updated: BaseActivityResponse = {
      ...response,
      response: updateResponse.response,
      updatedAt: new Date(),
    };
    this.responses.set(updateResponse.id, updated);
    return updated;
  }

  async deleteByActivityId({
    activityId,
  }: {
    activityId: number;
  }): Promise<void> {
    for (const [id, response] of this.responses.entries()) {
      if (response.activityId === activityId) {
        this.responses.delete(id);
      }
    }
  }

  seed(responses: BaseActivityResponse[]): void {
    for (const response of responses) {
      this.responses.set(response.id, response);
      if (response.id >= this.nextId) {
        this.nextId = response.id + 1;
      }
    }
  }

  reset(): void {
    this.responses.clear();
    this.nextId = 1;
  }

  getAll(): BaseActivityResponse[] {
    return Array.from(this.responses.values());
  }
}
