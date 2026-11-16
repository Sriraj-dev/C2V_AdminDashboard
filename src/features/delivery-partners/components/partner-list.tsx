import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import { formatPhone, telHref } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PartnerRow } from "../types";
import { PartnerFormDialog } from "./partner-form-dialog";
import { PartnerLinkActions } from "./partner-link-actions";
import { PartnerStatusToggle } from "./partner-status-toggle";

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        active
          ? "bg-status-success-bg text-status-success-fg"
          : "bg-status-neutral-bg text-status-neutral-fg",
      )}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function EditButton({ partner }: { partner: PartnerRow }) {
  return (
    <PartnerFormDialog
      partner={partner}
      trigger={
        <Button variant="outline" size="sm" className="min-h-11 md:min-h-8">
          <Pencil aria-hidden />
          Edit
        </Button>
      }
    />
  );
}

function linkDate(p: PartnerRow): string {
  return p.link && p.accessTokenCreatedAt
    ? formatDateTime(p.accessTokenCreatedAt)
    : "No link yet";
}

function Phone({ phone }: { phone: string }) {
  return (
    <a
      href={telHref(phone)}
      className="inline-flex min-h-11 items-center underline-offset-2 hover:underline md:min-h-0"
    >
      {formatPhone(phone)}
    </a>
  );
}

/** Table at md and up, cards below. Each row gets only its own link. */
export function PartnerList({ partners }: { partners: PartnerRow[] }) {
  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Open orders</TableHead>
              <TableHead>Link created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <Phone phone={p.phone} />
                </TableCell>
                <TableCell>
                  <ActiveBadge active={p.active} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.openOrderCount}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {linkDate(p)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <PartnerLinkActions partner={p} />
                    <EditButton partner={p} />
                    <PartnerStatusToggle partner={p} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col gap-2 md:hidden">
        {partners.map((p) => (
          <li
            key={p.id}
            className="flex flex-col gap-3 rounded-lg border bg-card p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.name}</p>
                <Phone phone={p.phone} />
              </div>
              <ActiveBadge active={p.active} />
            </div>
            <p className="text-sm text-muted-foreground">
              {p.openOrderCount} open{" "}
              {p.openOrderCount === 1 ? "order" : "orders"} · Link:{" "}
              {linkDate(p)}
            </p>
            <PartnerLinkActions partner={p} />
            <div className="flex flex-wrap gap-2">
              <EditButton partner={p} />
              <PartnerStatusToggle partner={p} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
