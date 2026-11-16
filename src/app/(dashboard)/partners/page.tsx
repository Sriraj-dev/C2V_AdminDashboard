import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Button } from "@/components/ui/button";
import { PartnerFormDialog, PartnerList, getPartners } from "@/features/delivery-partners";

export const metadata: Metadata = { title: "Partners" };

export default async function Page() {
  const partners = await getPartners();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Partners"
        actions={
          <>
            <RefreshButton />
            <PartnerFormDialog
              trigger={
                <Button size="sm" className="min-h-11 md:min-h-8">
                  <Plus aria-hidden />
                  Add partner
                </Button>
              }
            />
          </>
        }
      />
      {partners.length === 0 ? <EmptyState title="No delivery partners yet." /> : <PartnerList partners={partners} />}
    </div>
  );
}
