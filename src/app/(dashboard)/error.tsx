"use client";

import { ErrorState } from "@/components/shared/error-state";

const FALLBACK = "Something went wrong.";

/** API errors carry only the API's code/message, so they are safe to show. In production Next replaces other
 * server error messages with a generic text and a digest; fall back to a plain message for those. */
function displayMessage(error: Error & { digest?: string }): string {
  const message = error.message?.trim();
  if (!message || error.digest || /an error occurred in the server components render/i.test(message)) {
    return FALLBACK;
  }
  return message;
}

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState message={displayMessage(error)} onRetry={reset} />;
}
