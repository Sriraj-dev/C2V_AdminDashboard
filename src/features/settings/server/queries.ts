import "server-only";
import { adminRead } from "@/lib/api/admin";
import type { Settings } from "@/lib/api/types";

export async function getSettings(): Promise<Settings> {
  const { settings } = await adminRead<{ settings: Settings }>("/admin/settings");
  return settings;
}
