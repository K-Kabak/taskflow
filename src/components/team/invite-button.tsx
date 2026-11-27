"use client";

import { useRef, useState } from "react";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import { createInviteAction } from "@/app/actions/domain";

export function InviteButton({ workspaceId }: { workspaceId: string }) {
  const field = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setPending(true);
    setError("");
    try {
      const result = await createInviteAction(workspaceId);
      if (result.ok) setUrl(result.data.url);
      else setError(result.message);
    } catch {
      setError("Nie udało się wygenerować linku. Spróbuj ponownie.");
    } finally {
      setPending(false);
    }
  }

  async function copy() {
    if (!url) return;
    setError("");
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
      field.current?.focus();
      field.current?.select();
      setError("Skopiuj zaznaczony link ręcznie.");
    }
  }

  return (
    <div>
      {url ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={field}
            readOnly
            value={url}
            aria-label="Link zaproszenia"
            className="tf-input min-h-11 min-w-0 flex-1 basis-44 text-sm"
          />
          <button
            type="button"
            onClick={copy}
            className="tf-button-secondary flex min-h-11 items-center gap-2 px-3 text-sm"
          >
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? "Skopiowano" : "Kopiuj"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={create}
          disabled={pending}
          className="tf-button-primary flex min-h-11 items-center gap-2 px-4 text-sm"
        >
          {pending ? (
            <Loader2 className="animate-spin" size={17} aria-hidden="true" />
          ) : (
            <Link2 size={17} aria-hidden="true" />
          )}
          {pending ? "Generowanie…" : "Generuj link"}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
