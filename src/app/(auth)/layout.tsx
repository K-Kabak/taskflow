import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center px-5 py-10"><div className="w-full max-w-md"><Link href="/" className="mb-8 flex items-center justify-center" aria-label="TaskFlow — strona główna"><BrandLogo /></Link><div className="rounded-[24px] border border-white bg-white p-7 shadow-[0_24px_70px_rgba(37,37,37,0.08)] sm:p-9">{children}</div></div></main>;
}
