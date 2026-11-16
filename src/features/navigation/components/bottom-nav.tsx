"use client";

import { Ellipsis, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "../constants";
import type { NavCounts } from "../types";
import { isActive } from "../utils";
import { NavBadge, navAriaLabel } from "./nav-badges";

const itemClass =
  "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium text-muted-foreground";

/** Phone navigation: 4 primary items plus a "More" sheet with the rest and Log out. */
export function BottomNav({ counts, logoutAction }: { counts: NavCounts; logoutAction: () => Promise<void> }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = NAV_ITEMS.filter((i) => i.primary);
  const secondary = NAV_ITEMS.filter((i) => !i.primary);
  const moreActive = secondary.some((i) => isActive(pathname, i.href));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {primary.map((item) => {
        const active = isActive(pathname, item.href);
        const count = item.badge ? counts[item.badge] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={navAriaLabel(item.label, count)}
            className={cn(itemClass, active && "text-foreground")}
          >
            <span className="relative">
              <item.icon className="size-5" aria-hidden />
              {count > 0 && (
                <span className="absolute -top-1.5 left-3">
                  <NavBadge count={count} />
                </span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button type="button" className={cn(itemClass, moreActive && "text-foreground")}>
            <Ellipsis className="size-5" aria-hidden />
            More
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
            <SheetDescription className="sr-only">Other sections and log out</SheetDescription>
          </SheetHeader>
          <ul className="flex flex-col px-2 pb-2">
            {secondary.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-accent",
                      active && "bg-accent",
                    )}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" className="min-h-11 w-full justify-start gap-3 px-3">
                  <LogOut aria-hidden />
                  Log out
                </Button>
              </form>
            </li>
          </ul>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
