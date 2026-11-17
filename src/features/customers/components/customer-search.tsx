"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Search box that writes `q` to the URL (debounced) and resets the page. */
export function CustomerSearch({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  // The last q this component pushed; a URL value equal to it is our own echo and must not reset typing.
  const [lastPushed, setLastPushed] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value !== lastPushed) {
      setLastPushed(value);
      setText(value);
    }
  }
  const latest = useRef(searchParams);
  useEffect(() => {
    latest.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    const q = text.trim();
    if (q === lastPushed) return;
    const t = setTimeout(() => {
      setLastPushed(q);
      const params = new URLSearchParams(latest.current.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      params.delete("page");
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    }, 300);
    return () => clearTimeout(t);
  }, [text, lastPushed, router, pathname]);

  return (
    <div className="flex max-w-sm flex-col gap-1.5">
      <Label htmlFor="customer-search" className="text-xs text-muted-foreground">
        Search customers
      </Label>
      <Input
        id="customer-search"
        type="search"
        maxLength={100}
        placeholder="Name or phone"
        className="min-h-11 md:min-h-9"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
