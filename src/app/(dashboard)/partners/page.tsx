import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Partners" };

export default function Page() {
  return <PageHeader title="Partners" />;
}
