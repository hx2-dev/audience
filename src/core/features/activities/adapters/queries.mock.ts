import { injectable } from "tsyringe";
import type { Activity, CreateActivity, UpdateActivity } from "../types";

@injectable()
export class MockActivityQueries {
  private activities = new Map<number, Activity>();
  private nextId = 1;

  async getByEventId({ eventId }: { eventId: string }): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((a) => a.eventId === eventId && !a.deleted)
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  async getById({ id }: { id: number }): Promise<Activity | null> {
    const activity = this.activities.get(id);
    if (!activity || activity.deleted) {
      return null;
    }
    return activity;
  }

  async create({
    createActivity,
    userId,
  }: {
    createActivity: CreateActivity;
    userId: string;
  }): Promise<Activity> {
    const now = new Date();
    const activity: Activity = {
      id: this.nextId++,
      eventId: createActivity.eventId,
      name: createActivity.name,
      type: createActivity.type,
      data: createActivity.data,
      order: createActivity.order ?? 0,
      createdAt: now,
      updatedAt: now,
      updatedBy: userId,
      deleted: null,
    };
    this.activities.set(activity.id, activity);
    return activity;
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
    const activity = this.activities.get(activityId);
    if (!activity || activity.deleted) {
      return null;
    }
    const updated: Activity = {
      ...activity,
      ...(updateActivity.name !== undefined && { name: updateActivity.name }),
      ...(updateActivity.type !== undefined && { type: updateActivity.type }),
      ...(updateActivity.data !== undefined && { data: updateActivity.data }),
      ...(updateActivity.order !== undefined && { order: updateActivity.order }),
      updatedAt: new Date(),
      updatedBy: userId,
    };
    this.activities.set(activityId, updated);
    return updated;
  }

  async delete({ id, userId }: { id: number; userId: string }): Promise<void> {
    const activity = this.activities.get(id);
    if (activity && !activity.deleted) {
      this.activities.set(id, {
        ...activity,
        deleted: new Date(),
        updatedBy: userId,
      });
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
        const activity = this.activities.get(activityId);
        if (activity && !activity.deleted) {
          this.activities.set(activityId, {
            ...activity,
            order: i,
            updatedBy: userId,
          });
        }
      }
    }
  }

  seed(activities: Activity[]): void {
    for (const activity of activities) {
      this.activities.set(activity.id, activity);
      if (activity.id >= this.nextId) {
        this.nextId = activity.id + 1;
      }
    }
  }

  reset(): void {
    this.activities.clear();
    this.nextId = 1;
  }

  getAll(): Activity[] {
    return Array.from(this.activities.values());
  }
}
