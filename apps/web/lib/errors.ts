import { toast } from "sonner";
import { ConvexError } from "convex/values";

/**
 * Turn any thrown value into a safe, human-friendly message. Never leaks
 * stack traces, URLs, tokens or raw network errors to the UI.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof ConvexError) {
    // Convex mutations throw ConvexError with a string payload by convention.
    return typeof err.data === "string"
      ? err.data
      : "Something went wrong. Please try again.";
  }
  if (
    err instanceof TypeError ||
    (err instanceof Error && /failed to fetch|network|load failed/i.test(err.message))
  ) {
    return "Connection lost. Check your internet.";
  }
  if (err instanceof Error) {
    if (/not authenticated|unauthorized|permission|forbidden/i.test(err.message)) {
      return "You don't have permission to do this.";
    }
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

/** Show an error toast for any thrown value. */
export function notifyError(err: unknown): void {
  toast.error(errorMessage(err));
}

/** Show a success toast. */
export function notifySuccess(message: string): void {
  toast.success(message);
}
