export default function WorkspaceLoading() {
  return <div role="status" aria-label="Ładowanie widoku" className="tf-page animate-pulse space-y-6">
    <div className="h-8 w-2/3 max-w-sm rounded-xl bg-[var(--skeleton)]" />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 rounded-[var(--radius-card)] bg-[var(--skeleton)]" />)}</div>
    <div className="h-64 rounded-[var(--radius-card)] bg-[var(--skeleton)]" />
    <span className="sr-only">Ładowanie danych…</span>
  </div>;
}
