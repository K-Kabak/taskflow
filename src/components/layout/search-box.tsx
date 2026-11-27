"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";

type Results = {
  projects: { name: string; href: string }[];
  tasks: { title: string; projectName: string; href: string }[];
};

type SearchResponse = {
  query: string;
  workspaceId: string;
  results: Results | null;
};

export function SearchBox({ workspaceId }: { workspaceId: string }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const term = query.trim();
  const current = response?.query === term && response.workspaceId === workspaceId ? response : null;
  const pending = term.length >= 2 && !current;

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      let results: Results | null = null;
      try {
        const response = await fetch(`/api/w/${workspaceId}/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (response.ok) results = (await response.json()) as Results;
      } catch {
        // An aborted search belongs to a previous query or workspace.
      }
      if (!controller.signal.aborted) setResponse({ query: term, workspaceId, results });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, workspaceId]);

  function clearSearch() {
    setQuery("");
    setResponse(null);
    setOpen(false);
  }

  const results = current?.results;
  return (
    <div
      className="relative w-full min-w-0 md:max-w-64 lg:max-w-80"
      role="search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          input.current?.focus();
          setOpen(false);
        }
      }}
    >
      <Search
        aria-hidden="true"
        size={17}
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--subtle)] sm:left-3"
      />
      <input
        ref={input}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        aria-label="Szukaj projektów i zadań"
        placeholder="Szukaj…"
        className="tf-input h-10 w-full bg-[var(--muted-surface)] text-sm [padding-inline:2.1rem_2rem] focus:bg-[var(--input)]"
      />
      {pending && open ? (
        <Loader2
          size={16}
          aria-hidden="true"
          className="absolute top-3 right-3 animate-spin text-[var(--accent-ink)]"
        />
      ) : (
        query && (
          <button
            type="button"
            onClick={() => {
              input.current?.focus();
              clearSearch();
            }}
            aria-label="Wyczyść wyszukiwanie"
            className="absolute inset-y-0 right-0 grid w-8 place-items-center text-[var(--subtle)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )
      )}
      {open && current && term.length >= 2 && (
        <div className="fixed top-16 right-3 left-3 z-30 max-h-[min(24rem,70dvh)] overflow-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--elevated-surface)] p-2 shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-80">
          {!results && (
            <p role="status" className="p-3 text-sm text-[var(--muted)]">
              Wyszukiwanie jest chwilowo niedostępne.
            </p>
          )}
          {results && !results.projects.length && !results.tasks.length && (
            <p role="status" className="p-3 text-sm text-[var(--muted)]">
              Brak wyników dla „{term}”.
            </p>
          )}
          {!!results?.projects.length && (
            <ResultGroup
              title="Projekty"
              items={results.projects.map((project) => ({ label: project.name, href: project.href }))}
              close={clearSearch}
            />
          )}
          {!!results?.tasks.length && (
            <ResultGroup
              title="Zadania"
              items={results.tasks.map((task) => ({
                label: task.title,
                meta: task.projectName,
                href: task.href,
              }))}
              close={clearSearch}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({
  title,
  items,
  close,
}: {
  title: string;
  items: { label: string; meta?: string; href: string }[];
  close: () => void;
}) {
  return (
    <section>
      <h2 className="px-3 pt-2 pb-1 text-xs font-semibold text-[var(--muted)]">{title}</h2>
      {items.map((item) => (
        <Link
          onClick={close}
          key={item.href}
          href={item.href}
          className="block rounded-lg px-3 py-2.5 hover:bg-[var(--hover)]"
        >
          <span className="block text-sm font-medium [overflow-wrap:anywhere]">{item.label}</span>
          {item.meta && <span className="text-xs text-[var(--subtle)]">{item.meta}</span>}
        </Link>
      ))}
    </section>
  );
}
