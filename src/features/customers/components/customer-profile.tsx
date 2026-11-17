import { MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { formatPhone, telHref } from "@/lib/format";
import type { CustomerView } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { displayName, mapHref } from "../utils";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}

export function CustomerProfile({ customer }: { customer: CustomerView }) {
  const addr = customer.defaultAddress;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Section title="Profile">
        <dl>
          <Row label="Name">{displayName(customer)}</Row>
          <Row label="Phone">
            {customer.phone ? (
              <a href={telHref(customer.phone)} className="inline-flex min-h-11 items-center underline underline-offset-2 md:min-h-0">
                {formatPhone(customer.phone)}
              </a>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Email">{customer.email ?? "—"}</Row>
          <Row label="Joined">{formatDate(customer.createdAt)}</Row>
        </dl>
        <Link href={`/chats/${customer.id}`} className={cn(buttonVariants({ variant: "outline" }), "mt-3 min-h-11 md:min-h-9")}>
          <MessageSquare aria-hidden="true" />
          Open chat
        </Link>
      </Section>
      <Section title="Saved address">
        {addr ? (
          <div className="text-sm">
            <p className="font-medium">{addr.name}</p>
            <p>{addr.line1}</p>
            {addr.landmark && <p>Near {addr.landmark}</p>}
            <p>{addr.pincode}</p>
            {addr.phone && (
              <a href={telHref(addr.phone)} className="inline-flex min-h-11 items-center underline underline-offset-2 md:min-h-0">
                {formatPhone(addr.phone)}
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No saved address.</p>
        )}
        {customer.defaultLocation && (
          <a
            href={mapHref(customer.defaultLocation)}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "mt-3 min-h-11 md:min-h-9")}
          >
            <MapPin aria-hidden="true" />
            View on map
          </a>
        )}
      </Section>
    </div>
  );
}
