import { EmptyState } from "@/components/shared/empty-state";
import { NOT_ACTIVE_MESSAGE } from "@/features/partner-portal";

export default function PartnerNotFound() {
  return <EmptyState title={NOT_ACTIVE_MESSAGE} />;
}
