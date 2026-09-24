"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registerAction } from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    let workspaceId: string | undefined;

    if (mode === "register") {
      const result = await registerAction({ name: formData.get("name"), email, password, confirmPassword: formData.get("confirmPassword"), inviteToken: search.get("invite") || undefined });
      if (!result.ok) { setError(result.message); setPending(false); return; }
      workspaceId = result.data.workspaceId;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("Nieprawidłowy e-mail lub hasło."); setPending(false); return; }
    const invite = search.get("invite");
    router.push(invite ? `/invite/${encodeURIComponent(invite)}` : workspaceId ? `/w/${workspaceId}/dashboard` : search.get("callbackUrl") || "/");
    router.refresh();
  }

  return (
    <form action={submit} className="mt-8 space-y-5">
      {mode === "register" && <Field label="Imię" name="name" autoComplete="name" minLength={2} maxLength={80} />}
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
      <Field label="Hasło" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "register" ? 10 : undefined} />
      {mode === "register" && <Field label="Powtórz hasło" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} />}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60">
        {pending && <Loader2 size={18} className="animate-spin" />}{mode === "login" ? "Zaloguj się" : "Utwórz konto"}
      </button>
      <p className="text-center text-sm text-[#777772]">{mode === "login" ? "Nie masz konta?" : "Masz już konto?"} <Link className="font-semibold text-orange-600 hover:underline" href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Utwórz je" : "Zaloguj się"}</Link></p>
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...inputProps } = props;
  return <label className="block text-sm font-medium"><span className="mb-2 block">{label}</span><input required {...inputProps} className="w-full rounded-xl border border-[#deded9] bg-white px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100" /></label>;
}
