import { inject, singleton } from "tsyringe";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { ActivityQueries } from "~/adapters/db/queries/activities/queries";
import { ActivityResponseQueries } from "~/adapters/db/queries/responses/queries";
import type { Activity } from "~/core/features/activities/types";
import type { BaseActivityResponse } from "~/core/features/responses/types";
import {
  extractMultipleChoiceResponse,
  extractRankingResponse,
  extractFreeResponse,
} from "~/core/features/responses/validators";
import type {
  ActivityResult,
  MultipleChoiceResult,
  RankingResult,
  FreeResponseResult,
} from "~/core/features/activities/results";
import { pipe } from "fp-ts/lib/function";

@singleton()
export class ActivityResultsService {
  constructor(
    @inject(ActivityQueries)
    private readonly activityQueries: ActivityQueries,
    @inject(ActivityResponseQueries)
    private readonly responseQueries: ActivityResponseQueries,
  ) {}

  getResultsForActivity(activityId: number): TaskEither<Error, ActivityResult> {
    return pipe(
      this.activityQueries.getById({ id: activityId }),
      TE.flatMap((activity) =>
        pipe(
          this.responseQueries.getByActivityId({ activityId }),
          TE.map((responses) => this.processResults(activity, responses)),
        ),
      ),
    );
  }

  private processResults(
    activity: Activity,
    responses: BaseActivityResponse[],
  ): ActivityResult {
    const totalResponses = responses.length;

    switch (activity.type) {
      case "multiple-choice":
        return this.processMultipleChoiceResults(
          activity,
          responses,
          totalResponses,
        );
      case "ranking":
        return this.processRankingResults(activity, responses, totalResponses);
      case "free-response":
        return this.processFreeResponseResults(
          activity,
          responses,
          totalResponses,
        );
      default:
        throw new Error(`Unsupported activity type: ${activity.type}`);
    }
  }

  private processMultipleChoiceResults(
    activity: Activity,
    responses: BaseActivityResponse[],
    totalResponses: number,
  ): MultipleChoiceResult {
    const data = activity.data as {
      question?: string;
      options?: string[];
      allowMultiple?: boolean;
    };
    const optionCounts: Record<string, number> = {};

    // Initialize all options with 0 count
    (data.options ?? []).forEach((option: string) => {
      optionCounts[option] = 0;
    });

    console.log("responses", responses);

    // Count responses using Zod validation
    responses.forEach((response) => {
      const options = extractMultipleChoiceResponse(response.response);
      options.forEach((option) => {
        if (optionCounts[option] !== undefined) {
          optionCounts[option]++;
        }
      });
    });

    // Create results with percentages
    const options = Object.entries(optionCounts).map(([value, count]) => ({
      value,
      label: value,
      count,
      percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
    }));

    return {
      activityId: activity.id,
      totalResponses,
      activityType: "multiple-choice",
      question: data.question ?? "",
      allowMultiple: data.allowMultiple ?? false,
      options,
    };
  }

  private processRankingResults(
    activity: Activity,
    responses: BaseActivityResponse[],
    totalResponses: number,
  ): RankingResult {
    const data = activity.data as { question?: string; items?: string[] };
    const itemScores = new Map<string, { sum: number; count: number }>();

    // Initialize all items
    (data.items ?? []).forEach((item: string) => {
      itemScores.set(item, { sum: 0, count: 0 });
    });

    // Process responses using Zod validation
    responses.forEach((response) => {
      const ranking = extractRankingResponse(response.response);
      ranking.forEach((item, index) => {
        const scores = itemScores.get(item);
        if (scores) {
          scores.sum += index + 1; // Position starts at 1
          scores.count += 1;
        }
      });
    });

    // Calculate results
    const items = Array.from(itemScores.entries()).map(([item, scores]) => {
      const averagePosition = scores.count > 0 ? scores.sum / scores.count : 0;
      const score =
        scores.count > 0 ? (data.items?.length ?? 0) + 1 - averagePosition : 0;

      return {
        item,
        averagePosition,
        voteCount: scores.count,
        score,
      };
    });

    // Sort by score (higher is better)
    items.sort((a, b) => b.score - a.score);

    return {
      activityId: activity.id,
      totalResponses,
      activityType: "ranking",
      question: data.question ?? "",
      items,
    };
  }

  private processFreeResponseResults(
    activity: Activity,
    responses: BaseActivityResponse[],
    totalResponses: number,
  ): FreeResponseResult {
    const data = activity.data as { question?: string };
    const responseMap = new Map<string, number>();

    // Aggregate responses using Zod validation
    responses.forEach((response) => {
      const responseText = extractFreeResponse(response.response);
      if (responseText) {
        const normalizedResponse = responseText.trim().toLowerCase();
        if (normalizedResponse) {
          responseMap.set(
            normalizedResponse,
            (responseMap.get(normalizedResponse) ?? 0) + 1,
          );
        }
      }
    });

    // Create results with percentages
    const responseItems = Array.from(responseMap.entries())
      .map(([text, count]) => ({
        text,
        count,
        percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    return {
      activityId: activity.id,
      totalResponses,
      activityType: "free-response",
      question: data.question ?? "",
      responses: responseItems,
    };
  }
}
