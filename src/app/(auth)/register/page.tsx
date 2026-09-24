import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Rejestracja" };

export default function RegisterPage() {
  return <><h1 className="text-3xl font-semibold tracking-tight">Utwórz konto</h1><p className="mt-2 text-[#777772]">Twoja pierwsza przestrzeń będzie gotowa od razu.</p><Suspense><AuthForm mode="register" /></Suspense></>;
}
