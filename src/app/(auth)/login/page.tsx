import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Logowanie" };

export default function LoginPage() {
  return <><h1 className="text-3xl font-semibold tracking-tight">Witaj ponownie</h1><p className="mt-2 text-[#777772]">Zaloguj się, aby wrócić do swoich projektów.</p><Suspense><AuthForm mode="login" /></Suspense></>;
}
