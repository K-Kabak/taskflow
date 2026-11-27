"use client";

import { useRef, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registerAction } from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    void submit(new FormData(event.currentTarget));
  }

  async function submit(formData: FormData) {
    submitting.current = true;
    setPending(true);
    setError(null);
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "");
    let workspaceId: string | undefined;
    let navigating = false;

    try {
      if (mode === "register") {
        const result = await registerAction({
          name: formData.get("name"),
          email,
          password,
          confirmPassword: formData.get("confirmPassword"),
          inviteToken: search.get("invite") || undefined,
        });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        workspaceId = result.data.workspaceId;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Nieprawidłowy e-mail lub hasło.");
        return;
      }
      const invite = search.get("invite");
      router.push(
        invite
          ? `/invite/${encodeURIComponent(invite)}`
          : workspaceId
            ? `/w/${workspaceId}/dashboard`
            : search.get("callbackUrl") || "/",
      );
      router.refresh();
      navigating = true;
    } catch {
      setError("Nie udało się połączyć. Spróbuj ponownie.");
    } finally {
      if (!navigating) {
        submitting.current = false;
        setPending(false);
      }
    }
  }

  const buttonLabel = pending
    ? mode === "login"
      ? "Logowanie…"
      : "Tworzenie konta…"
    : mode === "login"
      ? "Zaloguj się"
      : "Utwórz konto";

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} aria-busy={pending} className="space-y-4">
        {mode === "register" && (
          <Field
            label="Imię"
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            disabled={pending}
          />
        )}
        <Field label="E-mail" name="email" type="email" autoComplete="email" disabled={pending} />
        <Field
          label="Hasło"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "register" ? 10 : undefined}
          hint={mode === "register" ? "Co najmniej 10 znaków." : undefined}
          disabled={pending}
        />
        {mode === "register" && (
          <Field
            label="Powtórz hasło"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={10}
            disabled={pending}
          />
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="tf-button-primary flex min-h-12 w-full items-center justify-center gap-2 px-4 py-3 text-sm disabled:cursor-wait"
        >
          {pending && <Loader2 size={18} aria-hidden="true" className="animate-spin" />}
          {buttonLabel}
        </button>
      </form>
      {pending && (
        <p role="status" aria-live="polite" className="mt-3 text-center text-sm text-[var(--muted)]">
          To może potrwać kilka sekund.
        </p>
      )}
      <p className="mt-6 border-t border-[var(--border)] pt-4 text-center text-sm text-[var(--muted)]">
        {mode === "login" ? "Nie masz konta?" : "Masz już konto?"}{" "}
        <Link
          className="font-semibold text-[var(--accent-ink)] hover:underline"
          href={mode === "login" ? "/register" : "/login"}
        >
          {mode === "login" ? "Utwórz je" : "Zaloguj się"}
        </Link>
      </p>
    </div>
  );
}

function Field(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; hint?: string },
) {
  const { label, hint, ...inputProps } = props;
  const hintId = hint ? `auth-${props.name}-hint` : undefined;
  return (
    <div>
      <label className="block text-sm font-medium">
        <span className="mb-1.5 block">{label}</span>
        <input
          required
          {...inputProps}
          aria-describedby={hintId}
          className="tf-input min-h-12 w-full px-3.5"
        />
      </label>
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-[var(--muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
