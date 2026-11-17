import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Button } from "@/components/ui/button";
import { PincodeFormDialog, PincodeList, getPincodes } from "@/features/pincodes";

export const metadata: Metadata = { title: "Pincodes" };

export default async function Page() {
  const pincodes = await getPincodes();
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Pincodes"
        description="Where you deliver, and on which weekday. Changes show in the next order form a customer opens."
        actions={
          <>
            <RefreshButton />
            <PincodeFormDialog
              trigger={
                <Button size="sm" className="min-h-11 md:min-h-8">
                  <Plus aria-hidden />
                  Add pincode
                </Button>
              }
            />
          </>
        }
      />
      {pincodes.length === 0 ? <EmptyState title="No pincodes yet." /> : <PincodeList pincodes={pincodes} />}
    </div>
  );
}
