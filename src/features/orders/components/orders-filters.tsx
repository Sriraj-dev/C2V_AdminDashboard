"use client";

import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { OrderStatus } from "@/lib/api/types";
import { ALL_STATUSES, REAL_STATUSES, STATUS_LABEL } from "../constants";

export type PartnerOption = { id: string; name: string };

function useSetParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const latest = useRef(new URLSearchParams(searchParams.toString()));
  useEffect(() => {
    latest.current = new URLSearchParams(searchParams.toString());
  }, [searchParams]);
  return (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams(latest.current.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    const next = params.toString();
    latest.current = new URLSearchParams(next);
    router.replace(next ? `${pathname}?${next}` : pathname);
  };
}

function DebouncedInput({
  id,
  value,
  onCommit,
  ...props
}: { id: string; value: string; onCommit: (v: string) => void } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setText(value);
  }
  const commit = useRef(onCommit);
  useEffect(() => {
    commit.current = onCommit;
  });
  useEffect(() => {
    if (text === value) return;
    const t = setTimeout(() => commit.current(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text, value]);
  return <Input id={id} value={text} onChange={(e) => setText(e.target.value)} {...props} />;
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-36 flex-1 flex-col gap-1.5 sm:flex-none">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function PartnerSelect({
  id,
  value,
  partners,
  withUnassigned,
  onChange,
}: {
  id: string;
  value: string;
  partners: PartnerOption[];
  withUnassigned: boolean;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? undefined : v)}>
      <SelectTrigger id={id} className="w-full sm:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All partners</SelectItem>
        {withUnassigned && <SelectItem value="unassigned">Unassigned</SelectItem>}
        {partners.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Validated filter values (from the schemas), never raw URL params. */
export type FilterValues = Partial<Record<"date" | "deliveryFrom" | "deliveryTo" | "pincode" | "partnerId" | "q" | "status" | "includeUnpaid", string>>;

export function OrdersFilters({
  view,
  partners,
  values,
}: {
  view: "active" | "history";
  partners: PartnerOption[];
  values: FilterValues;
}) {
  const set = useSetParams();
  const get = (k: keyof FilterValues) => values[k] ?? "";

  const statusParam = get("status");
  const selected = statusParam ? statusParam.split(",") : [];
  const includeUnpaid = get("includeUnpaid") === "1";
  const statusOptions: readonly OrderStatus[] = includeUnpaid ? ALL_STATUSES : REAL_STATUSES;

  const toggleStatus = (s: OrderStatus, on: boolean) => {
    const next = on ? [...selected, s] : selected.filter((x) => x !== s);
    set({ status: next.length ? next.join(",") : undefined });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      {view === "active" ? (
        <Field label="Delivery date" htmlFor="f-date">
          <Input id="f-date" type="date" value={get("date")} onChange={(e) => set({ date: e.target.value || undefined })} />
        </Field>
      ) : (
        <>
          <Field label="Status" htmlFor="f-status">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button id="f-status" variant="outline" className="w-full justify-between sm:w-44">
                  {selected.length ? `${selected.length} selected` : "All statuses"}
                  <ChevronDown aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {statusOptions.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s}
                    checked={selected.includes(s)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(on) => toggleStatus(s, on)}
                  >
                    {STATUS_LABEL[s]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>
          <Field label="Delivery from" htmlFor="f-from">
            <Input id="f-from" type="date" value={get("deliveryFrom")} onChange={(e) => set({ deliveryFrom: e.target.value || undefined })} />
          </Field>
          <Field label="Delivery to" htmlFor="f-to">
            <Input id="f-to" type="date" value={get("deliveryTo")} onChange={(e) => set({ deliveryTo: e.target.value || undefined })} />
          </Field>
        </>
      )}
      <Field label="Pincode" htmlFor="f-pincode">
        <DebouncedInput
          id="f-pincode"
          inputMode="numeric"
          maxLength={6}
          placeholder="560001"
          value={get("pincode")}
          onCommit={(v) => set({ pincode: v || undefined })}
          className="sm:w-28"
        />
      </Field>
      <Field label="Partner" htmlFor="f-partner">
        <PartnerSelect
          id="f-partner"
          value={get("partnerId")}
          partners={partners}
          withUnassigned={view === "active"}
          onChange={(v) => set({ partnerId: v })}
        />
      </Field>
      <Field label="Search" htmlFor="f-q">
        <DebouncedInput
          id="f-q"
          type="search"
          maxLength={100}
          placeholder="Code, name or phone"
          value={get("q")}
          onCommit={(v) => set({ q: v || undefined })}
          className="sm:w-52"
        />
      </Field>
      {view === "history" && (
        <div className="flex items-center gap-2 pb-1.5">
          <Switch
            id="f-unpaid"
            checked={includeUnpaid}
            onCheckedChange={(on) => set({ includeUnpaid: on ? "1" : undefined, status: undefined })}
          />
          <Label htmlFor="f-unpaid" className="text-sm">
            Include unpaid
          </Label>
        </div>
      )}
    </div>
  );
}
