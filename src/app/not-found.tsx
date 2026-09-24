import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-5"><div className="text-center"><p className="text-sm font-semibold text-orange-600">404</p><h1 className="mt-2 text-3xl font-semibold">Nie znaleziono strony</h1><p className="mt-3 text-[#777772]">Ten zasób nie istnieje albo nie masz do niego dostępu.</p><Link href="/" className="mt-6 inline-block rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white">Wróć do TaskFlow</Link></div></main>;
}
