import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { formatPhone, telHref } from "@/lib/format";
import type { CustomerView } from "@/lib/api/types";
import { displayName } from "../utils";

function Phone({ phone }: { phone: string | null }) {
  if (!phone) return <span className="text-muted-foreground">No phone</span>;
  return (
    <a href={telHref(phone)} className="underline underline-offset-2">
      {formatPhone(phone)}
    </a>
  );
}

/** Table at md and up, cards below. Both render; CSS shows one. */
export function CustomerList({ customers }: { customers: CustomerView[] }) {
  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Pincode</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/customers/${c.id}`} className="font-medium underline-offset-2 hover:underline">
                    {displayName(c)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Phone phone={c.phone} />
                </TableCell>
                <TableCell>{c.defaultAddress?.pincode ?? "—"}</TableCell>
                <TableCell>{formatDate(c.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col gap-2 md:hidden">
        {customers.map((c) => (
          <li key={c.id} className="rounded-lg border bg-card p-3 text-sm">
            <Link
              href={`/customers/${c.id}`}
              className="block min-h-11 truncate py-2 font-medium focus-visible:outline-2 focus-visible:outline-ring"
            >
              {displayName(c)}
            </Link>
            <div className="flex items-center justify-between gap-2">
              {c.phone ? (
                <a href={telHref(c.phone)} className="inline-flex min-h-11 items-center underline underline-offset-2">
                  {formatPhone(c.phone)}
                </a>
              ) : (
                <span className="text-muted-foreground">No phone</span>
              )}
              <span className="text-muted-foreground">{c.defaultAddress?.pincode ?? "—"}</span>
            </div>
            <p className="text-muted-foreground">Joined {formatDate(c.createdAt)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
