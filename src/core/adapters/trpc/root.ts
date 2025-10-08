import "reflect-metadata";
import { eventRouter } from "~/core/adapters/trpc/routers/event";
import { presenterRouter } from "~/core/adapters/trpc/routers/presenter";
import { activitiesRouter } from "~/core/adapters/trpc/routers/activities";
import { responsesRouter } from "~/core/adapters/trpc/routers/responses";
import { questionsRouter } from "~/core/adapters/trpc/routers/questions";
import {
  createCallerFactory,
  createTRPCRouter,
} from "~/core/adapters/trpc/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  event: eventRouter,
  presenter: presenterRouter,
  activities: activitiesRouter,
  responses: responsesRouter,
  questions: questionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
