import Link from "next/link";
import { cn } from "@/lib/utils";

export type OrdersView = "active" | "history";

const TABS: { view: OrdersView; label: string }[] = [
  { view: "active", label: "Active" },
  { view: "history", label: "History" },
];

export function OrdersTabs({ view }: { view: OrdersView }) {
  return (
    <nav aria-label="Orders view" className="flex gap-1 border-b">
      {TABS.map((t) => (
        <Link
          key={t.view}
          href={`/orders?view=${t.view}`}
          aria-current={view === t.view ? "page" : undefined}
          className={cn(
            "-mb-px flex min-h-11 items-center border-b-2 px-3 text-sm font-medium md:min-h-9",
            view === t.view ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
