"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary";

export function TaskDialogFrame({ taskId, returnHref, children }: { taskId: string; returnHref: string; children: React.ReactNode }) {
  const router = useRouter();
  const panel = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeButton.current?.focus(), 50);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      let attempts = 0;
      const restoreTimer = window.setInterval(() => {
        if (new URL(window.location.href).searchParams.has("task") && attempts++ < 20) return;
        const opener = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).find((link) => new URL(link.href).searchParams.get("task") === taskId && link.getClientRects().length);
        if (opener || attempts++ >= 20) {
          opener?.focus();
          window.clearInterval(restoreTimer);
        }
      }, 50);
    };
  }, [taskId]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      router.push(returnHref, { scroll: false });
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>(focusableSelector) || []).filter((item) => item.getClientRects().length);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return <div className="fixed inset-0 z-40 flex justify-end bg-black/35">
    <button type="button" aria-label="Zamknij szczegóły zadania" tabIndex={-1} onClick={() => router.push(returnHref, { scroll: false })} className="absolute inset-0" />
    <aside ref={panel} role="dialog" aria-modal="true" aria-labelledby="task-panel-heading" onKeyDown={handleKeyDown} className="relative h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-xl sm:p-7">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-white pb-3"><p id="task-panel-heading" className="text-sm font-semibold text-[var(--accent-ink)]">Szczegóły zadania</p><button ref={closeButton} type="button" onClick={() => router.push(returnHref, { scroll: false })} aria-label="Zamknij panel zadania" className="min-h-10 min-w-10 rounded-lg p-2 hover:bg-[var(--muted-surface)]"><X size={19} /></button></div>
      {children}
    </aside>
  </div>;
}
