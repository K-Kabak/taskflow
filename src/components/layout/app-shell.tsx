"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { CalendarDays, ChevronsUpDown, FolderKanban, Gauge, LogOut, Menu, Settings, UserRoundCheck, Users, X } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { SearchBox } from "@/components/layout/search-box";

type ShellProps = {
  workspace: { id: string; name: string };
  workspaces: { id: string; name: string }[];
  user: { name: string; email: string; avatarColor: string };
  children: React.ReactNode;
};

const navigation = [
  { href: "dashboard", label: "Dashboard", icon: Gauge },
  { href: "projects", label: "Projekty", icon: FolderKanban },
  { href: "my-tasks", label: "Moje zadania", icon: UserRoundCheck },
  { href: "calendar", label: "Kalendarz", icon: CalendarDays },
];

export function AppShell({ workspace, workspaces, user, children }: ShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const sidebar = <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-[#ececea] bg-[#fafaf8] px-4 py-5">
    <Link href={`/w/${workspace.id}/dashboard`} className="mb-6 flex items-center gap-3 px-2 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-orange-500 text-white">T</span>TaskFlow</Link>
    <label className="relative mb-6 block"><span className="sr-only">Aktywna przestrzeń</span><select value={workspace.id} onChange={(event) => router.push(`/w/${event.target.value}/dashboard`)} className="h-11 w-full appearance-none rounded-xl border border-[#e8e8e3] bg-white px-3 pr-9 text-sm font-medium"><option disabled>Przestrzeń</option>{workspaces.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><ChevronsUpDown className="pointer-events-none absolute top-3.5 right-3 text-[#8a8a84]" size={15} /></label>
    <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-[#9a9a95] uppercase">Główne</p>
    <nav className="space-y-1">{navigation.map((item) => { const href = `/w/${workspace.id}/${item.href}`; const active = pathname.startsWith(href); return <Link onClick={() => setOpen(false)} key={item.href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-white font-semibold text-[#252525] shadow-sm" : "text-[#6f6f6b] hover:bg-white/70"}`}><item.icon size={17} className={active ? "text-orange-500" : ""} />{item.label}</Link>; })}</nav>
    <nav className="mt-auto space-y-1"><Link onClick={() => setOpen(false)} href={`/w/${workspace.id}/team`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#6f6f6b] hover:bg-white"><Users size={17} />Zespół</Link><Link onClick={() => setOpen(false)} href={`/w/${workspace.id}/settings`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#6f6f6b] hover:bg-white"><Settings size={17} />Ustawienia</Link></nav>
  </aside>;

  return <div className="flex h-dvh overflow-hidden bg-[#f7f7f5]">
    <div className="hidden md:block">{sidebar}</div>
    {open && <div className="fixed inset-0 z-50 md:hidden"><button aria-label="Zamknij menu" className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} /><div className="relative h-full w-[272px] shadow-2xl">{sidebar}<button aria-label="Zamknij menu" onClick={() => setOpen(false)} className="absolute top-5 right-4 rounded-lg p-2 hover:bg-[#f0f0ed]"><X size={18} /></button></div></div>}
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-[#ececea] bg-white px-4 sm:px-6"><button onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-[#f7f7f5] md:hidden" aria-label="Otwórz menu"><Menu size={20} /></button><SearchBox workspaceId={workspace.id} /><div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold leading-tight">{user.name}</p><p className="text-xs text-[#8a8a84]">{user.email}</p></div><Avatar name={user.name} color={user.avatarColor} /><button onClick={() => signOut({ callbackUrl: "/login" })} title="Wyloguj się" aria-label="Wyloguj się" className="rounded-xl p-2 text-[#777772] hover:bg-[#f7f7f5] hover:text-red-600"><LogOut size={18} /></button></div></header>
      <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
