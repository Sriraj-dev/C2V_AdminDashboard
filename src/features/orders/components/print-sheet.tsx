import { formatDeliveryDate } from "@/lib/dates";
import { formatPhone, toFullPhone } from "@/lib/format";
import type { OrderView } from "@/lib/api/types";
import { PrintButton } from "./print-button";

type Props = { tenantName: string; partnerName: string; date: string; orders: OrderView[] };

export function PrintSheet({ tenantName, partnerName, date, orders }: Props) {
  return (
    <div className="mx-auto max-w-5xl p-4 text-sm text-black">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">{tenantName}</h1>
          <p>
            {partnerName} · {formatDeliveryDate(date)} · {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        </div>
        <PrintButton />
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left">
              {["#", "Order", "Customer", "Phone", "Address", "Items", "✓"].map((h) => (
                <th key={h} className="border border-black px-2 py-1">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => {
              const phone = o.customer.phone ?? o.address.phone;
              return (
                <tr key={o.id} className="align-top break-inside-avoid">
                  <td className="border border-black px-2 py-1">{i + 1}</td>
                  <td className="border border-black px-2 py-1 whitespace-nowrap">{o.orderCode}</td>
                  <td className="border border-black px-2 py-1">{o.address.name || o.customer.profileName || ""}</td>
                  <td className="border border-black px-2 py-1 whitespace-nowrap">
                    {phone ? formatPhone(toFullPhone(phone)) : ""}
                  </td>
                  <td className="border border-black px-2 py-1">
                    {o.address.line1}, {o.pincode}
                    {o.address.landmark && <div>Landmark: {o.address.landmark}</div>}
                  </td>
                  <td className="border border-black px-2 py-1">
                    {o.items.map((it) => `${it.name} × ${it.quantity}`).join(", ")}
                  </td>
                  <td className="w-10 border border-black px-2 py-1" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
