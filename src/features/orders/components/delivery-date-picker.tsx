import Link from "next/link";
import { formatDeliveryDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Props = { dates: { date: string; count: number }[]; selected: string; today: string };

/** Date chips, URL driven (`?date=`). Overdue dates are flagged in the danger tone. */
export function DeliveryDatePicker({ dates, selected, today }: Props) {
  return (
    <nav aria-label="Delivery date" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {dates.map(({ date, count }) => {
        const overdue = date < today;
        const isSelected = date === selected;
        return (
          <Link
            key={date}
            href={`/?date=${date}`}
            aria-current={isSelected ? "date" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 flex-col justify-center rounded-lg border px-3 text-sm md:min-h-10",
              isSelected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted/50",
            )}
          >
            <span className="font-medium whitespace-nowrap">
              {formatDeliveryDate(date)} · {count}
            </span>
            {overdue && (
              <span className={cn("text-xs font-medium", isSelected ? "text-primary-foreground" : "text-destructive")}>
                Overdue
              </span>
            )}
            {date === today && <span className="text-xs">Today</span>}
          </Link>
        );
      })}
    </nav>
  );
}
