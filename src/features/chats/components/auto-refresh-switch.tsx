"use client";

import { useId, useState } from "react";
import { AutoRefresh } from "@/components/shared/auto-refresh";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** Off on every load. `<AutoRefresh>` only exists while the switch is on. */
export function AutoRefreshSwitch({ intervalMs }: { intervalMs: number }) {
  const id = useId();
  const [on, setOn] = useState(false);
  return (
    <div className="flex min-h-11 items-center gap-2 md:min-h-8">
      <Switch id={id} checked={on} onCheckedChange={setOn} />
      <Label htmlFor={id} className="text-sm">
        Auto-refresh
      </Label>
      {on && <AutoRefresh intervalMs={intervalMs} />}
    </div>
  );
}
