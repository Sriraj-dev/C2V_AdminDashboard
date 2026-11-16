import { vi } from "vitest";

export type MockCookieJar = {
  get: ReturnType<typeof vi.fn<(name: string) => { name: string; value: string } | undefined>>;
  set: ReturnType<typeof vi.fn<(name: string, value: string, options?: unknown) => void>>;
  delete: ReturnType<typeof vi.fn<(name: string) => void>>;
};

export type NextMocks = {
  jar: MockCookieJar;
  redirect: ReturnType<typeof vi.fn<(url: string) => never>>;
  notFound: ReturnType<typeof vi.fn<() => never>>;
  revalidatePath: ReturnType<typeof vi.fn>;
  revalidateTag: ReturnType<typeof vi.fn>;
};

/**
 * Mocks `next/headers` (in-memory cookie jar), `next/navigation` (redirect and notFound throw) and `next/cache`.
 * Call it in a test, then dynamically import the module under test (after `vi.resetModules()`).
 */
export function mockNextHeaders(initial: Record<string, string> = {}): NextMocks {
  const store = new Map<string, string>(Object.entries(initial));
  const jar: MockCookieJar = {
    get: vi.fn((name: string) => {
      const value = store.get(name);
      return value === undefined ? undefined : { name, value };
    }),
    set: vi.fn((name: string, value: string) => {
      store.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      store.delete(name);
    }),
  };
  const redirect = vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
  const notFound = vi.fn((): never => {
    throw new Error("NEXT_NOT_FOUND");
  });
  const revalidatePath = vi.fn();
  const revalidateTag = vi.fn();
  vi.doMock("next/headers", () => ({ cookies: async () => jar }));
  vi.doMock("next/navigation", () => ({ redirect, notFound, unstable_rethrow: vi.fn() }));
  vi.doMock("next/cache", () => ({ revalidatePath, revalidateTag }));
  return { jar, redirect, notFound, revalidatePath, revalidateTag };
}
