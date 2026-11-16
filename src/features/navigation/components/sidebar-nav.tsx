"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "../constants";
import type { NavCounts } from "../types";
import { isActive } from "../utils";
import { NavBadge, navAriaLabel } from "./nav-badges";

export function SidebarNav({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();
  const firstSecondary = NAV_ITEMS.findIndex((i) => !i.primary);
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5 p-2">
      {NAV_ITEMS.map((item, index) => {
        const active = isActive(pathname, item.href);
        const count = item.badge ? counts[item.badge] : 0;
        return (
          <Fragment key={item.href}>
            {index === firstSecondary && <Separator className="my-2" />}
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={navAriaLabel(item.label, count)}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate">{item.label}</span>
              <NavBadge count={count} />
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
