import type { NavCounts } from "../types";
import { SidebarNav } from "./sidebar-nav";

export function AppSidebar({ tenantName, counts }: { tenantName: string; counts: NavCounts }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[232px] flex-col border-r bg-sidebar md:flex">
      <div className="flex h-12 items-center border-b px-4">
        <span className="truncate text-sm font-semibold">{tenantName}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav counts={counts} />
      </div>
    </aside>
  );
}
