import { getCurrentUser } from "@/features/auth";

/** Minimal layout for printable pages: no dashboard shell, but a session is still required. */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await getCurrentUser();
  return <div className="min-h-dvh bg-white">{children}</div>;
}
