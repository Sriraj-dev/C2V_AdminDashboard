import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser, logoutAction } from "@/features/auth";
import { AppSidebar, BottomNav, getNavCounts } from "@/features/navigation";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const [user, counts] = await Promise.all([getCurrentUser(), getNavCounts()]);
  return (
    <div className="min-h-dvh bg-muted/50">
      <AppSidebar tenantName={user.tenantName} counts={counts} />
      <div className="flex min-h-dvh flex-col md:pl-[232px]">
        <SiteHeader tenantName={user.tenantName} logoutAction={logoutAction} />
        <main className="flex-1 p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">{children}</main>
      </div>
      <BottomNav counts={counts} logoutAction={logoutAction} />
    </div>
  );
}
