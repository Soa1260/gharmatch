export type ErrorCode = "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "INVALID" | "RATE_LIMITED" | "UNAUTHENTICATED";

/** Errors that are safe to show to the user. Anything else is logged and replaced by a generic message. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}
