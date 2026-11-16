import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3">
      <EmptyState title="Order not found." />
      <Link href="/orders" className="text-sm underline underline-offset-2">
        Back to Orders
      </Link>
    </div>
  );
}
