import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Top bar of the page area: tenant name on phones (the sidebar shows it on desktop), Log out on desktop. */
export function SiteHeader({ tenantName, logoutAction }: { tenantName: string; logoutAction: () => Promise<void> }) {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b bg-card px-4">
      <span className="truncate text-sm font-semibold md:invisible">{tenantName}</span>
      <form action={logoutAction} className="hidden md:block">
        <Button type="submit" variant="ghost" size="sm">
          <LogOut aria-hidden />
          Log out
        </Button>
      </form>
    </header>
  );
}
