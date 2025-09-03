import type { TRPCError } from "@trpc/server";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function toTrpcError(error: Error): TRPCError {
  if (error instanceof NotFoundError) {
    return { code: "NOT_FOUND", message: error.message, name: error.name };
  }
  if (error instanceof ForbiddenError) {
    return { code: "FORBIDDEN", message: error.message, name: error.name };
  }
  if (error instanceof UnauthorizedError) {
    return { code: "UNAUTHORIZED", message: error.message, name: error.name };
  }
  return {
    code: "INTERNAL_SERVER_ERROR",
    message: error.message,
    name: error.name,
  };
}
