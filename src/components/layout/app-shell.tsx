"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, CalendarDays, ChevronsUpDown, FolderKanban, Gauge, LogOut, Menu, Settings, UserRoundCheck, Users, X } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { SearchBox } from "@/components/layout/search-box";
import { BrandLogo } from "@/components/shared/brand-logo";

type ShellProps = {
  workspace: { id: string; name: string };
  workspaces: { id: string; name: string }[];
  user: { name: string; email: string; avatarColor: string };
  unreadNotifications: number;
  children: React.ReactNode;
};

const navigation = [
  { href: "dashboard", label: "Dashboard", icon: Gauge },
  { href: "projects", label: "Projekty", icon: FolderKanban },
  { href: "my-tasks", label: "Moje zadania", icon: UserRoundCheck },
  { href: "calendar", label: "Kalendarz", icon: CalendarDays },
];

const focusableSelector = "a[href], button:not([disabled]), select:not([disabled]), input:not([disabled])";

export function AppShell({ workspace, workspaces, user, unreadNotifications, children }: ShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = menuButton.current;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  function handleDrawerKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(drawer.current?.querySelectorAll<HTMLElement>(focusableSelector) || []);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function sidebar(mobile = false) {
    const itemClass = (active: boolean) => `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent-ink)]" : "text-[#595953] hover:bg-white hover:text-[var(--foreground)]"}`;
    const navLink = (href: string, label: string, Icon: typeof Gauge) => {
      const active = pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={itemClass(active)}><Icon size={18} aria-hidden="true" />{label}</Link>;
    };
    return <aside className={`flex h-full flex-col border-r border-[var(--border)] bg-[var(--muted-surface)] px-4 py-5 ${mobile ? "w-[min(280px,85vw)]" : "w-[232px]"}`}>
      <Link href={`/w/${workspace.id}/dashboard`} onClick={() => setOpen(false)} className="mb-7 flex min-h-11 items-center px-2" aria-label="TaskFlow — dashboard"><BrandLogo /></Link>
      <label className="relative mb-7 block"><span className="sr-only">Aktywna przestrzeń</span><select value={workspace.id} title={workspace.name} onChange={(event) => { setOpen(false); router.push(`/w/${event.target.value}/dashboard`); }} className="tf-input h-11 w-full appearance-none truncate pr-9 text-sm font-medium">{workspaces.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><ChevronsUpDown className="pointer-events-none absolute top-3.5 right-3 text-[var(--muted)]" size={15} aria-hidden="true" /></label>
      <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-[var(--muted)] uppercase">Główne</p>
      <nav aria-label="Główna nawigacja" className="space-y-1">{navigation.map((item) => navLink(`/w/${workspace.id}/${item.href}`, item.label, item.icon))}</nav>
      <nav aria-label="Przestrzeń robocza" className="mt-auto space-y-1 border-t border-[var(--border)] pt-4">
        {navLink(`/w/${workspace.id}/team`, "Zespół", Users)}
        {navLink(`/w/${workspace.id}/settings`, "Ustawienia", Settings)}
      </nav>
    </aside>;
  }

  return <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
    <div className="hidden md:block">{sidebar()}</div>
    {open && <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu nawigacyjne" onKeyDown={handleDrawerKeyDown}>
      <button aria-label="Zamknij menu" className="absolute inset-0 bg-black/35" onClick={() => setOpen(false)} tabIndex={-1} />
      <div ref={drawer} className="relative h-full w-fit shadow-2xl">{sidebar(true)}<button aria-label="Zamknij menu" onClick={() => setOpen(false)} className="absolute top-6 right-4 rounded-lg p-2 hover:bg-white"><X size={18} /></button></div>
    </div>}
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-6">
        <button ref={menuButton} onClick={() => setOpen(true)} className="rounded-xl p-2 hover:bg-[var(--muted-surface)] md:hidden" aria-label="Otwórz menu" aria-expanded={open}><Menu size={20} /></button>
        <SearchBox workspaceId={workspace.id} />
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3"><Link href={`/w/${workspace.id}/notifications`} aria-label={`Powiadomienia, nieprzeczytane: ${unreadNotifications}`} title="Powiadomienia" className="relative grid min-h-11 min-w-11 place-items-center rounded-xl text-[var(--muted)] hover:bg-[var(--muted-surface)] hover:text-[var(--foreground)]"><Bell size={19} aria-hidden="true" />{unreadNotifications > 0 && <span className="absolute -top-1 -right-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link><div className="hidden text-right sm:block"><p className="text-sm font-semibold leading-tight">{user.name}</p><p className="text-xs text-[var(--muted)]">{user.email}</p></div><Avatar name={user.name} color={user.avatarColor} /><button onClick={() => signOut({ callbackUrl: "/login" })} title="Wyloguj się" aria-label="Wyloguj się" className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--muted-surface)] hover:text-red-700"><LogOut size={18} /></button></div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
