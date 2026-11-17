import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pincode } from "@/lib/api/types";
import { weekdayName } from "@/lib/dates";
import { PincodeActiveSwitch } from "./pincode-active-switch";
import { PincodeFormDialog } from "./pincode-form-dialog";

function EditButton({ pincode }: { pincode: Pincode }) {
  return (
    <PincodeFormDialog
      pincode={pincode}
      trigger={
        <Button variant="outline" size="sm" className="min-h-11 md:min-h-8">
          <Pencil aria-hidden />
          Edit
        </Button>
      }
    />
  );
}

/** Table at md and up, cards below. */
export function PincodeList({ pincodes }: { pincodes: Pincode[] }) {
  return (
    <>
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pincode</TableHead>
              <TableHead>Delivery day</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pincodes.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium tabular-nums">{p.pincode}</TableCell>
                <TableCell>{weekdayName(p.deliveryWeekday)}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground" title={p.note ?? undefined}>
                  {p.note ?? ""}
                </TableCell>
                <TableCell>
                  <PincodeActiveSwitch pincode={p} />
                </TableCell>
                <TableCell>
                  <EditButton pincode={p} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col gap-2 md:hidden">
        {pincodes.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
            <div className="min-w-0">
              <p className="font-medium tabular-nums">
                {p.pincode} <span className="font-normal text-muted-foreground">· {weekdayName(p.deliveryWeekday)}</span>
              </p>
              {p.note && <p className="break-words text-sm text-muted-foreground">{p.note}</p>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PincodeActiveSwitch pincode={p} />
              <EditButton pincode={p} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
