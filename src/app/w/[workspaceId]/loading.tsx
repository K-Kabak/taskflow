export default function WorkspaceLoading() {
  return <div role="status" aria-label="Ładowanie widoku" className="mx-auto max-w-7xl animate-pulse space-y-6">
    <div className="h-8 w-2/3 max-w-sm rounded-xl bg-[#e9e9e4]" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 rounded-[var(--radius-card)] bg-[#e9e9e4]" />)}</div>
    <div className="h-64 rounded-[var(--radius-card)] bg-[#e9e9e4]" />
    <span className="sr-only">Ładowanie danych…</span>
  </div>;
}
