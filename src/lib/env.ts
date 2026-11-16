import "server-only";
import { z } from "zod";

const schema = z.object({
  C2V_API_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
  PUBLIC_APP_URL: z.url(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse({
    C2V_API_URL: process.env.C2V_API_URL,
    PUBLIC_APP_URL: process.env.PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    const keys = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))];
    throw new Error(`Invalid or missing environment variables: ${keys.join(", ")}`);
  }
  cached = parsed.data;
  return cached;
}

export function resetServerEnvForTests(): void {
  cached = undefined;
}
