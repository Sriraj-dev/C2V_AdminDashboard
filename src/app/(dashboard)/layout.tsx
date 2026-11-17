import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser, logoutAction } from "@/features/auth";
import { AppSidebar, BottomNav, getNavCounts } from "@/features/navigation";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const [user, counts] = await Promise.all([getCurrentUser(), getNavCounts()]);
  return (
    <div className="min-h-dvh bg-muted/50">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-card px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <AppSidebar tenantName={user.tenantName} counts={counts} />
      <div className="flex min-h-dvh flex-col md:pl-[232px]">
        <SiteHeader tenantName={user.tenantName} logoutAction={logoutAction} />
        <main id="main" tabIndex={-1} className="flex-1 outline-none p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">{children}</main>
      </div>
      <BottomNav counts={counts} logoutAction={logoutAction} />
    </div>
  );
}
