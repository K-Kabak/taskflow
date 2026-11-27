import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Rejestracja" };

export default function RegisterPage() {
  return <><h1 className="tf-page-heading">Utwórz konto</h1><p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">Twoja pierwsza przestrzeń będzie gotowa od razu.</p><Suspense><AuthForm mode="register" /></Suspense></>;
}
