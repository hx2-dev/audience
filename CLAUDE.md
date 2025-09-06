# hx2-audience

*An audience participation tool for classrooms and presentations.*

## Overview

hx2-audience is a web application designed to facilitate audience interaction during lectures, presentations, or
meetings. It allows participants to submit questions, vote on topics, complete polls, and engage in real-time
discussions. It uses the T3 Stack and Drizzle ORM, and implements a shallow version of Clean Architecture via the `src/core` and `src/adapters` folders.

## Technology

- Next.js
- TypeScript
- Tailwind CSS
- tRPC
- Drizzle ORM
- PostgreSQL

## Project Structure

```
hx2-audience
├── devops/
├── public/
├── src/
│   ├── adapters/
│   │   ├── db/ -- database logic
│   │   └── trpc/ -- tRPC logic
│   ├── app/
│   ├── components/
│   │   ├── features/ -- feature-specific components
│   │   ├── ui/ -- core UI components
│   │   ├── hooks/
│   │   └── custom/
│   ├── core/ -- core business logic of the application
│   │   ├── features/
│   │   │   ├── events/ -- Events where questions and polls are asked
│   │   │   ├── ... -- other features
│   │   │   └── questions/ -- Questions asked by the audience
│   │   └── generic/
│   │       └── auth/ -- auth logic and configuration
│   ├── lib/
│   │   └── utils.ts -- utility functions (mostly for UI components)
│   ├── styles/ -- styles
│   └── env.js -- environment variables
├── tsconfig.json -- typescript configuration
├── drizzle.config.ts -- drizzle configuration
└── CLAUDE.md -- this file
```

## Functional Programming Patterns

The codebase uses `fp-ts` for functional programming patterns:

- **`TaskEither<Error, T>`** - Represents async operations that can fail
- **`TE.tryCatch`** - Wraps async operations that might throw exceptions
- **`TE.flatMap`** - Chains operations that return `TaskEither`
- **`TE.fromPredicate`** - Creates validation functions
- **`pipe`** - Composes operations in a readable way

### Key Benefits:
- **Type Safety** - Errors are part of the type system
- **Composability** - Operations can be easily chained
- **No Exceptions** - Errors are handled explicitly
- **Testability** - Pure functions are easier to test

## Creating a new feature

To create a new feature, you need to create a new folder in the
`src/core/features` folder. For example, if we were creating a new feature for
questions, we would create the `src/core/features/questions` folder. Then, we 
would create or modify the following files:

`src/core/features/questions/questions.ts`
```ts
import { z } from "zod";

export const createQuestionValidator = z.object({
  question: z.string().min(1),
  order: z.number().int().min(0),
  eventId: z.uuid(),
});

export type CreateQuestion = z.infer<typeof createQuestionValidator>;

export const questionValidator = createQuestionValidator.extend({
  id: z.number().int().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string().min(1),
});

export type Question = z.infer<typeof questionValidator>;

export const updateQuestionValidator = createQuestionValidator.partial();

export type UpdateQuestion = z.infer<typeof updateQuestionValidator>;
```

`src/adapters/db/schema.ts`
```ts
export const questions = createTable("question", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  eventId: d.uuid().notNull().references(() => events.id),
  question: d.varchar({ length: 256 }).notNull(),
  order: d.integer().notNull().default(0),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(sql`CURRENT_TIMESTAMP`),
  updatedBy: d.varchar({ length: 255 }).notNull().references(() => users.id),
  deleted: d.timestamp({ withTimezone: true }).nullable().default(null),
}), (t) => [
  index("event_id_idx").on(t.eventId),
]);
```

Now, create a queries file for the feature. This is where the database logic is
implemented.

`src/core/features/questions/queries.ts`
```ts
import { eq, and, isNull } from "drizzle-orm";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { db, type SchemaConnection } from "~/adapters/db";
import { questions } from "~/adapters/db/schema";
import { injectable } from "tsyringe";
import type { Question, CreateQuestion, UpdateQuestion } from "~/core/features/questions/types";
import type { UndefinedToNullable } from "~/lib/types";
import { NotFoundError } from "~/core/common/error";

export const QuestionQueriesSymbol = Symbol("QuestionQueries");

@injectable({ token: QuestionQueriesSymbol })
export class QuestionQueries {
  private rowToQuestion(question: UndefinedToNullable<Question>): Question {
    return {
      ...question,
      // Handle any nullable fields that should be undefined or otherwise
      // mapped from the database.
    };
  }

  getQuestionsByEventId({
    eventId,
    connection = db,
  }: {
    eventId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Question[]> {
    return TE.tryCatch(
      async () => {
        const questions = await connection.query.questions.findMany({
          where: and(eq(questions.eventId, eventId), isNull(questions.deleted)),
          orderBy: (questions, { asc }) => [asc(questions.order)],
        });

        return questions.map((question) => this.rowToQuestion(question));
      },
      (error) => error as Error,
    );
  }

  getById({
    id,
    connection = db,
  }: {
    id: number;
    connection?: SchemaConnection;
  }): TaskEither<Error, Question> {
    return TE.tryCatch(
      async () => {
        const question = (await connection.query.questions.findFirst({
          where: and(eq(questions.id, id), isNull(questions.deleted)),
        })) satisfies UndefinedToNullable<Question> | undefined;

        if (!question) {
          throw new NotFoundError("Question not found");
        }
        return this.rowToQuestion(question);
      },
      (error) => error as Error,
    );
  }

  create({
    createQuestion,
    userId,
    connection = db,
  }: {
    createQuestion: CreateQuestion;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Question> {
    return TE.tryCatch(
      async () => {
        const [question]: UndefinedToNullable<Question>[] = await connection
          .insert(questions)
          .values({ ...createQuestion, updatedBy: userId })
          .returning()
          .execute();

        if (!question) {
          throw new NotFoundError("Question not created");
        }
        return this.rowToQuestion(question);
      },
      (error) => error as Error,
    );
  }

  update({
    questionId,
    updateQuestion,
    userId,
    connection = db,
  }: {
    questionId: number;
    updateQuestion: UpdateQuestion;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, Question> {
    return TE.tryCatch(
      async () => {
        const [question]: UndefinedToNullable<Question>[] = await connection
          .update(questions)
          .set({ ...updateQuestion, updatedBy: userId })
          .where(and(eq(questions.id, questionId), isNull(questions.deleted)))
          .returning()
          .execute();

        if (!question) {
          throw new NotFoundError("Question not updated");
        }
        return this.rowToQuestion(question);
      },
      (error) => error as Error,
    );
  }

  delete({
    id,
    userId,
    connection = db,
  }: {
    id: number;
    userId: string;
    connection?: SchemaConnection;
  }): TaskEither<Error, void> {
    return TE.tryCatch(
      async () => {
        await connection
          .update(questions)
          .set({ deleted: new Date(), updatedBy: userId })
          .where(and(eq(questions.id, id), isNull(questions.deleted)))
          .execute();
      },
      (error) => error as Error,
    );
  }
}
```

Now, create a service file for the feature. This is where access control and
business logic is implemented using functional programming patterns with `fp-ts`.

`src/core/features/questions/service.ts`
```ts
import { injectable, inject } from "tsyringe";
import * as TE from "fp-ts/lib/TaskEither";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { type QuestionQueries, QuestionQueriesSymbol } from "~/core/features/questions/queries";
import { type EventService, EventServiceSymbol } from "~/core/features/events/service";
import { ForbiddenError } from "~/core/common/error";
import type { Question, CreateQuestion, UpdateQuestion } from "~/core/features/questions/types";
import { pipe } from "fp-ts/lib/function";

export const QuestionServiceSymbol = Symbol("QuestionService");

@injectable({ token: QuestionServiceSymbol })
export class QuestionService {
  constructor(
    @inject(QuestionQueriesSymbol)
    private readonly questionQueries: QuestionQueries,
    @inject(EventServiceSymbol)
    private readonly eventService: EventService,
  ) {}

  getQuestionsByEventId(eventId: string): TaskEither<Error, Question[]> {
    return this.questionQueries.getQuestionsByEventId({ eventId });
  }

  getById(id: number): TaskEither<Error, Question> {
    return this.questionQueries.getById({ id });
  }

  create(createQuestion: CreateQuestion, userId: string): TaskEither<Error, Question> {
    return pipe(
      this.eventService.getById(createQuestion.eventId),
      TE.flatMap((event) => this.checkEventAuthorization(event, userId)),
      TE.flatMap(() => this.questionQueries.create({ createQuestion, userId })),
    );
  }

  update(
    questionId: number,
    updateQuestion: UpdateQuestion,
    userId: string,
  ): TaskEither<Error, Question> {
    return pipe(
      this.getById(questionId),
      TE.flatMap((question) => this.checkEventAuthorization(question, userId)),
      TE.flatMap(() =>
        this.questionQueries.update({ questionId, updateQuestion, userId }),
      ),
    );
  }

  delete(questionId: number, userId: string): TaskEither<Error, void> {
    return pipe(
      this.getById(questionId),
      TE.flatMap((question) => this.checkEventAuthorization(question, userId)),
      TE.flatMap(() => this.questionQueries.delete({ id: questionId, userId })),
    );
  }

  private checkEventAuthorization(event: any, userId: string) {
    return TE.fromPredicate(
      (event: any) => event.creatorId === userId,
      (event: any) =>
        new ForbiddenError(
          `User ${userId} is not authorized to access event ${event.id}`,
        ),
    );
  }
}
```

`src/adapters/trpc/routes/questions.ts`
```ts
import { z } from "zod";
import * as E from "fp-ts/lib/Either";
import { createTRPCRouter, publicProcedure } from "~/adapters/trpc/trpc";
import { container } from "tsyringe";
import { QuestionServiceSymbol } from "~/core/features/questions/service";
import type { QuestionService } from "~/core/features/questions/service";

const serviceCall = async <T>(fn: (service: QuestionService) => TaskEither<Error, T>) => {
  const service = container.resolve<QuestionService>(QuestionServiceSymbol);
  const result = await fn(service)();

  return E.match(
    (error: Error) => {
      throw toTrpcError(error);
    },
    (data: T) => data,
  )(result);
}

export const questionsRouter = createTRPCRouter({
  getQuestionsByEventId: publicProcedure
    .input(z.object({ eventId: z.uuid() }))
    .query(({ input }) => {
      return serviceCall((service) => service.getQuestionsByEventId(input.eventId));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      return serviceCall((service) => service.getById(input.id));
    }),

  create: publicProcedure
    .input(z.object({
      question: z.string().min(1),
      eventId: z.uuid(),
    }))
    .mutation(({ input, ctx }) => {
      return serviceCall((service) => service.create(input, ctx.user.id));
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      question: z.string().min(1),
    }))
    .mutation(({ input, ctx }) => {
      return serviceCall((service) => service.update(input, ctx.user.id));
    }),
});
```

## Guidelines
* Never use `any` in the codebase. It is explicitly forbidden to use `any`.
* Never use the not-null assertion (`value!`). It is explicitly forbidden to use `!`.
* Never import `React`. Instead, import the utilities from `react` directly.
* Casting `as ___` is also forbidden. Use a validator, or type things properly.
* Run `bun run check` to catch errors after making changes. Preexisting issues
  should be fixed.