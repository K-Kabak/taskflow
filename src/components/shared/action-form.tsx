"use client";

import { useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";

type ActionFormProps = {
  action: (formData: FormData) => Promise<ActionResult | void>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  successMessage?: string;
};

export function ActionForm({ action, children, className, resetOnSuccess = false, successMessage = "Zapisano zmiany." }: ActionFormProps) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setResult(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const response = await action(formData);
        if (response?.ok === false) {
          setResult(response);
        } else {
          if (resetOnSuccess) formRef.current?.reset();
          setResult({ ok: true, data: undefined });
        }
      } catch {
        setResult({ ok: false, code: "INTERNAL_ERROR", message: "Nie udało się zapisać. Spróbuj ponownie." });
      } finally {
        submitting.current = false;
      }
    });
  }

  return <form ref={formRef} onSubmit={onSubmit} className={className} aria-busy={pending} noValidate>
    <fieldset disabled={pending} className="contents">{children}</fieldset>
    {pending && <p role="status" className="mt-3 text-sm text-[#777772]">Zapisywanie…</p>}
    {result?.ok === false && <div role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800"><p>{result.message}</p>{result.fieldErrors && <ul className="mt-1 list-inside list-disc">{Object.entries(result.fieldErrors).flatMap(([field, messages]) => messages.map((message) => <li key={`${field}:${message}`}>{message}</li>))}</ul>}</div>}
    {result?.ok === true && <p role="status" className="mt-3 text-sm text-green-700">{successMessage}</p>}
  </form>;
}
