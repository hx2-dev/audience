# hx2-audience

_An audience participation tool for classrooms and presentations._

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
export const questions = createTable(
  "question",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    eventId: d
      .uuid()
      .notNull()
      .references(() => events.id),
    question: d.varchar({ length: 256 }).notNull(),
    order: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: d
      .timestamp({ withTimezone: true })
      .$onUpdate(sql`CURRENT_TIMESTAMP`),
    updatedBy: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    deleted: d.timestamp({ withTimezone: true }).nullable().default(null),
  }),
  (t) => [index("event_id_idx").on(t.eventId)],
);
```

Now, create a queries file for the feature. This is where the database logic is
implemented.

`src/core/features/questions/queries.ts`

```ts
import { singleton } from "tsyringe";
import { supabaseServiceClient } from "~/adapters/db/supabase-service-client";
import type {
  Question,
  CreateQuestion,
  UpdateQuestion,
} from "~/core/features/questions/types";

@singleton()
export class QuestionQueries {
  private rowToQuestion(row: Record<string, unknown>): Question {
    return {
      id: row.id,
      question: row.question,
      order: row.order,
      eventId: row.event_id,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      updatedBy: row.updated_by,
    };
  }

  async getQuestionsByEventId(eventId: string): Promise<Question[]> {
    const { data, error } = await supabaseServiceClient
      .from("hx2_question")
      .select("*")
      .eq("event_id", eventId)
      .is("deleted", null)
      .order("order", { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => this.rowToQuestion(row));
  }

  async getById(id: number): Promise<Question | null> {
    const { data, error } = await supabaseServiceClient
      .from("hx2_question")
      .select("*")
      .eq("id", id)
      .is("deleted", null)
      .single();

    if (error?.code === "PGRST116") return null;
    if (error) throw error;
    if (!data) return null;
    return this.rowToQuestion(data);
  }

  async create(
    createQuestion: CreateQuestion,
    userId: string,
  ): Promise<Question> {
    const { data, error } = await supabaseServiceClient
      .from("hx2_question")
      .insert({
        question: createQuestion.question,
        order: createQuestion.order,
        event_id: createQuestion.eventId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return this.rowToQuestion(data);
  }

  async update(
    questionId: number,
    updateQuestion: UpdateQuestion,
    userId: string,
  ): Promise<Question | null> {
    const { data, error } = await supabaseServiceClient
      .from("hx2_question")
      .update({
        ...(updateQuestion.question !== undefined && {
          question: updateQuestion.question,
        }),
        ...(updateQuestion.order !== undefined && {
          order: updateQuestion.order,
        }),
        updated_by: userId,
      })
      .eq("id", questionId)
      .is("deleted", null)
      .select()
      .single();

    if (error?.code === "PGRST116") return null;
    if (error) throw error;
    return this.rowToQuestion(data);
  }

  async delete(id: number, userId: string): Promise<void> {
    const { error } = await supabaseServiceClient
      .from("hx2_question")
      .update({ deleted: new Date().toISOString(), updated_by: userId })
      .eq("id", id)
      .is("deleted", null);

    if (error) throw error;
  }
}
```

Now, create a service file for the feature. This is where access control and
business logic is implemented using async/await with thrown errors.

`src/core/features/questions/service.ts`

```ts
import { singleton, inject } from "tsyringe";
import { QuestionQueries } from "~/core/features/questions/queries";
import { EventService } from "~/core/features/events/service";
import { ForbiddenError, NotFoundError } from "~/core/common/error";
import type {
  Question,
  CreateQuestion,
  UpdateQuestion,
} from "~/core/features/questions/types";
import type { Event } from "~/core/features/events/types";

@singleton()
export class QuestionService {
  constructor(
    @inject(QuestionQueries)
    private readonly questionQueries: QuestionQueries,
    @inject(EventService)
    private readonly eventService: EventService,
  ) {}

  async getQuestionsByEventId(eventId: string): Promise<Question[]> {
    return this.questionQueries.getQuestionsByEventId(eventId);
  }

  async getById(id: number): Promise<Question | null> {
    return this.questionQueries.getById(id);
  }

  async create(
    createQuestion: CreateQuestion,
    userId: string,
  ): Promise<Question> {
    const event = await this.eventService.getById(createQuestion.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);
    return this.questionQueries.create(createQuestion, userId);
  }

  async update(
    questionId: number,
    updateQuestion: UpdateQuestion,
    userId: string,
  ): Promise<Question> {
    const question = await this.getById(questionId);
    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const event = await this.eventService.getById(question.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);

    const updated = await this.questionQueries.update(
      questionId,
      updateQuestion,
      userId,
    );
    if (!updated) {
      throw new NotFoundError("Question not found after update");
    }
    return updated;
  }

  async delete(questionId: number, userId: string): Promise<void> {
    const question = await this.getById(questionId);
    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const event = await this.eventService.getById(question.eventId);
    if (!event) {
      throw new NotFoundError("Event not found");
    }
    this.checkEventAuthorization(event, userId);

    await this.questionQueries.delete(questionId, userId);
  }

  private checkEventAuthorization(event: Event, userId: string): void {
    if (event.creatorId !== userId) {
      throw new ForbiddenError(
        `User ${userId} is not authorized to access event ${event.id}`,
      );
    }
  }
}
```

`src/adapters/trpc/routes/questions.ts`

```ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/adapters/trpc/trpc";
import { container } from "tsyringe";
import { QuestionService } from "~/core/features/questions/service";
import { toTrpcError } from "~/adapters/trpc/error";

const serviceCall = async <T>(
  fn: (service: QuestionService) => Promise<T>,
): Promise<T> => {
  const service = container.resolve<QuestionService>(QuestionService);
  try {
    return await fn(service);
  } catch (error) {
    throw toTrpcError(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
};

export const questionsRouter = createTRPCRouter({
  getQuestionsByEventId: publicProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(({ input }) => {
      return serviceCall((service) =>
        service.getQuestionsByEventId(input.eventId),
      );
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      return serviceCall((service) => service.getById(input.id));
    }),

  create: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        eventId: z.string().uuid(),
      }),
    )
    .mutation(({ input, ctx }) => {
      return serviceCall((service) =>
        service.create(input, ctx.session.user.id),
      );
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        question: z.string().min(1),
      }),
    )
    .mutation(({ input, ctx }) => {
      return serviceCall((service) =>
        service.update(
          input.id,
          { question: input.question },
          ctx.session.user.id,
        ),
      );
    }),
});
```

## Guidelines

- Never use `any` in the codebase. It is explicitly forbidden to use `any`.
- Never use the not-null assertion (`value!`). It is explicitly forbidden to use `!`.
- Never import `React`. Instead, import the utilities from `react` directly.
- Casting `as ___` is also forbidden. Use a validator, or type things properly.
- Run `bun run check` to catch errors after making changes. Preexisting issues
  should be fixed.
