"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function PartnerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState message="Couldn't load your deliveries. Try again." onRetry={reset} />;
}
