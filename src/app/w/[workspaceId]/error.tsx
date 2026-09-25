"use client";

export default function WorkspaceError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <div role="alert" className="tf-card mx-auto max-w-lg p-8 text-center">
    <h1 className="text-xl font-semibold">Nie udało się wczytać widoku</h1>
    <p className="mt-2 text-sm text-[var(--muted)]">Spróbuj ponownie. Jeśli problem się powtarza, odśwież stronę.</p>
    <button onClick={retry} className="tf-button-primary mt-5 px-5 py-2.5">Spróbuj ponownie</button>
  </div>;
}
