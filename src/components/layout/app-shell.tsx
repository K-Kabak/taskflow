"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  ChevronsUpDown,
  FolderKanban,
  LayoutDashboard,
  Layers3,
  LogOut,
  Menu,
  Settings,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { SearchBox } from "@/components/layout/search-box";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";

type ShellProps = {
  workspace: { id: string; name: string };
  workspaces: { id: string; name: string }[];
  user: { name: string; email: string; avatarColor: string };
  unreadNotifications: number;
  children: React.ReactNode;
};

const navigation = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "projects", label: "Projekty", icon: FolderKanban },
  { href: "my-tasks", label: "Moje zadania", icon: UserRoundCheck },
  { href: "calendar", label: "Kalendarz", icon: CalendarDays },
];

const workspaceNavigation = [
  { href: "team", label: "Zespół", icon: Users },
  { href: "settings", label: "Ustawienia", icon: Settings },
];

const focusableSelector = "a[href], button:not([disabled]), select:not([disabled]), input:not([disabled])";

export function AppShell({ workspace, workspaces, user, unreadNotifications, children }: ShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const currentSection = pathname.split("/")[3];
  const sectionLabel =
    currentSection === "notifications"
      ? "Powiadomienia"
      : [...navigation, ...workspaceNavigation].find((item) => item.href === currentSection)?.label;
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = menuButton.current;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 48rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    drawer.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
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
    const navLink = ({ href, label, icon: Icon }: (typeof navigation)[number]) => {
      const destination = `/w/${workspace.id}/${href}`;
      const active = pathname === destination || pathname.startsWith(`${destination}/`);
      return (
        <Link
          key={href}
          href={destination}
          onClick={() => setOpen(false)}
          aria-current={active ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 text-sm transition-colors ${active ? "bg-[var(--selected)] font-semibold text-[var(--accent-ink)]" : "font-medium text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]"}`}
        >
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
          {label}
        </Link>
      );
    };

    return (
      <aside
        className={`flex h-full flex-col overflow-auto border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 ${mobile ? "w-[min(292px,88vw)]" : "w-52 lg:w-58"}`}
      >
        <Link
          href={`/w/${workspace.id}/dashboard`}
          onClick={() => setOpen(false)}
          className="mb-7 flex min-h-11 w-fit items-center px-2"
          aria-label="TaskFlow — dashboard"
        >
          <BrandLogo />
        </Link>
        <label className="relative mb-7 block">
          <span className="sr-only">Aktywna przestrzeń</span>
          <Layers3
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--accent-ink)]"
            size={16}
            aria-hidden="true"
          />
          <select
            value={workspace.id}
            title={workspace.name}
            onChange={(event) => {
              setOpen(false);
              router.push(`/w/${event.target.value}/dashboard`);
            }}
            className="tf-input h-11 w-full appearance-none truncate bg-[var(--muted-surface)] pr-8 pl-9 text-sm font-semibold"
          >
            {workspaces.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <ChevronsUpDown
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[var(--muted)]"
            size={15}
            aria-hidden="true"
          />
        </label>
        <p className="mb-2 px-3 text-xs font-semibold text-[var(--subtle)]">Praca</p>
        <nav aria-label="Główna nawigacja" className="space-y-1">
          {navigation.map(navLink)}
        </nav>
        <nav
          aria-label="Przestrzeń robocza"
          className="mt-auto space-y-1 border-t border-[var(--border)] pt-4"
        >
          {workspaceNavigation.map(navLink)}
        </nav>
        <div className="mt-4 flex min-w-0 items-center gap-2.5 border-t border-[var(--border)] px-2 pt-4">
          <Avatar name={user.name} color={user.avatarColor} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" title={user.name}>
              {user.name}
            </p>
            <p className="truncate text-xs text-[var(--muted)]" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const notificationsPath = `/w/${workspace.id}/notifications`;
  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
      <div className="hidden md:block" inert={open}>
        {sidebar()}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu nawigacyjne"
          onKeyDown={handleDrawerKeyDown}
        >
          <button
            aria-label="Zamknij menu"
            className="absolute inset-0 bg-[var(--overlay)]"
            onClick={() => setOpen(false)}
            tabIndex={-1}
          />
          <div ref={drawer} className="relative h-full w-fit shadow-2xl">
            {sidebar(true)}
            <button
              aria-label="Zamknij menu"
              onClick={() => setOpen(false)}
              className="tf-icon-button absolute top-5 right-3"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col" inert={open}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-[var(--surface)] focus:p-3"
        >
          Przejdź do treści
        </a>
        <header className="tf-app-header flex h-16 shrink-0 items-center gap-1 border-b border-[var(--border)] bg-[var(--surface)] sm:gap-3">
          <button
            ref={menuButton}
            onClick={() => setOpen(true)}
            className="tf-icon-button -ml-2 shrink-0 md:hidden"
            aria-label="Otwórz menu"
            aria-expanded={open}
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          <div className="mr-auto hidden min-w-0 items-center gap-2 text-sm md:flex">
            <span className="truncate text-[var(--muted)]" title={workspace.name}>
              {workspace.name}
            </span>
            {sectionLabel && (
              <>
                <ChevronRight size={14} className="shrink-0 text-[var(--subtle)]" aria-hidden="true" />
                <span className="shrink-0 font-semibold">{sectionLabel}</span>
              </>
            )}
          </div>
          <SearchBox workspaceId={workspace.id} />
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <ThemeSwitcher />
            <Link
              href={notificationsPath}
              aria-current={pathname === notificationsPath ? "page" : undefined}
              aria-label={`Powiadomienia, nieprzeczytane: ${unreadNotifications}`}
              title="Powiadomienia"
              className="tf-icon-button relative"
            >
              <Bell size={19} aria-hidden="true" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0 right-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-[var(--on-accent)]">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Wyloguj się"
              aria-label="Wyloguj się"
              className="tf-icon-button hover:text-[var(--danger)]"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="tf-app-content min-h-0 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
