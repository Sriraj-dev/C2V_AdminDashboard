/** Plain count pill; renders nothing at 0. Parent link supplies the accessible name via `aria-label`. */
export function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium leading-5 text-primary-foreground"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function navAriaLabel(label: string, count: number): string {
  return count > 0 ? `${label}, ${count} pending` : label;
}
