import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Logowanie" };

export default function LoginPage() {
  return <><h1 className="tf-page-heading">Witaj ponownie</h1><p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">Zaloguj się, aby wrócić do swoich projektów.</p><Suspense><AuthForm mode="login" /></Suspense></>;
}
