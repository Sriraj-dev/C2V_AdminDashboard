export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Deliveries</p>
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}
