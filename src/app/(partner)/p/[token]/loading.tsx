import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-7 w-40" />
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}
