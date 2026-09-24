"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";

type Results = { projects: { id: string; name: string; href: string }[]; tasks: { id: string; title: string; projectName: string; href: string }[] };

export function SearchBox({ workspaceId }: { workspaceId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/w/${workspaceId}/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (response.ok) setResults(await response.json() as Results);
      } finally { setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, workspaceId]);

  const total = (results?.projects.length ?? 0) + (results?.tasks.length ?? 0);
  const showResults = query.trim().length >= 2 && results;
  return <div ref={box} className="relative w-full max-w-md">
    <Search aria-hidden size={17} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#8a8a84]" />
    <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Szukaj projektów i zadań" placeholder="Szukaj w przestrzeni…" className="h-10 w-full rounded-xl border border-[#e7e7e2] bg-[#fafaf8] pr-10 pl-10 text-sm outline-none focus:border-orange-300 focus:bg-white" />
    {loading ? <Loader2 size={16} className="absolute top-3 right-3 animate-spin text-orange-500" /> : query && <button onClick={() => { setQuery(""); setResults(null); }} aria-label="Wyczyść wyszukiwanie" className="absolute top-2.5 right-3 text-[#8a8a84]"><X size={17} /></button>}
    {showResults && <div className="absolute top-12 right-0 left-0 z-50 max-h-96 overflow-auto rounded-2xl border border-[#ececea] bg-white p-2 shadow-xl">
      {total === 0 && <p className="p-4 text-sm text-[#777772]">Brak wyników dla „{query}”.</p>}
      {results.projects.length > 0 && <ResultGroup title="Projekty" items={results.projects.map((p) => ({ label: p.name, href: p.href }))} close={() => setQuery("")} />}
      {results.tasks.length > 0 && <ResultGroup title="Zadania" items={results.tasks.map((t) => ({ label: t.title, meta: t.projectName, href: t.href }))} close={() => setQuery("")} />}
    </div>}
  </div>;
}

function ResultGroup({ title, items, close }: { title: string; items: { label: string; meta?: string; href: string }[]; close: () => void }) {
  return <section><p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-[#92928d] uppercase">{title}</p>{items.map((item) => <Link onClick={close} key={item.href} href={item.href} className="block rounded-xl px-3 py-2 hover:bg-orange-50"><span className="block text-sm font-medium">{item.label}</span>{item.meta && <span className="text-xs text-[#848484]">{item.meta}</span>}</Link>)}</section>;
}
