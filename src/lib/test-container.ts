import "reflect-metadata";
import { container } from "tsyringe";

import { EventQueriesSymbol } from "~/core/features/events/adapters/queries";
import { MockEventQueries } from "~/core/features/events/adapters/queries.mock";

import { QuestionQueriesSymbol } from "~/core/features/questions/adapters/queries";
import { MockQuestionQueries } from "~/core/features/questions/adapters/queries.mock";

import { ActivityQueriesSymbol } from "~/core/features/activities/adapters/queries";
import { MockActivityQueries } from "~/core/features/activities/adapters/queries.mock";

import { ActivityResponseQueriesSymbol } from "~/core/features/responses/adapters/queries";
import { MockActivityResponseQueries } from "~/core/features/responses/adapters/queries.mock";

import { PresenterQueriesSymbol } from "~/core/features/presenter/adapters/queries";
import { MockPresenterQueries } from "~/core/features/presenter/adapters/queries.mock";
import {
  PresenterService,
  PresenterServiceSymbol,
} from "~/core/features/presenter/service";

export function setupContainer(): typeof container {
  container.reset();

  container.registerInstance(EventQueriesSymbol, new MockEventQueries());
  container.registerInstance(QuestionQueriesSymbol, new MockQuestionQueries());
  container.registerInstance(ActivityQueriesSymbol, new MockActivityQueries());
  container.registerInstance(ActivityResponseQueriesSymbol, new MockActivityResponseQueries());
  container.registerInstance(PresenterQueriesSymbol, new MockPresenterQueries());
  container.register(PresenterServiceSymbol, { useClass: PresenterService });

  return container;
}
