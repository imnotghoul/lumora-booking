"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { adminRequest, getErrorMessage } from "@/components/admin/api";

const navigation = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard, exact: true },
  { href: "/admin/appointments", label: "Записи", icon: CalendarDays },
  { href: "/admin/services", label: "Услуги", icon: Scissors },
  { href: "/admin/specialists", label: "Специалисты", icon: UsersRound },
  { href: "/admin/schedule", label: "Расписание", icon: Clock3 },
];

const pageTitles: Record<string, string> = {
  "/admin": "Обзор",
  "/admin/appointments": "Записи",
  "/admin/services": "Услуги",
  "/admin/specialists": "Специалисты",
  "/admin/schedule": "Расписание",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await adminRequest<unknown>("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      toast({
        tone: "error",
        title: "Не удалось выйти",
        description: getErrorMessage(error),
      });
    } finally {
      setLoggingOut(false);
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 px-5">
        <span className="grid size-10 place-items-center rounded-2xl bg-accent-600 text-white shadow-lg shadow-accent-600/20">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-base font-extrabold tracking-tight text-ink">Lumora</p>
          <p className="text-xs font-medium text-muted">Панель управления</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Навигация администратора">
        {navigation.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-accent-50 text-accent-700"
                  : "text-muted hover:bg-slate-50 hover:text-ink",
              )}
            >
              <Icon
                className={cn(
                  "size-[19px]",
                  active ? "text-accent-600" : "text-slate-400 group-hover:text-muted",
                )}
                aria-hidden
              />
              <span className="flex-1">{item.label}</span>
              {active ? <ChevronRight className="size-4" aria-hidden /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600">
            <UserRound className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Администратор</p>
            <p className="truncate text-xs text-muted">Защищённая сессия</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted transition hover:bg-red-50 hover:text-danger disabled:opacity-50"
        >
          {loggingOut ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : (
            <LogOut className="size-[18px]" aria-hidden />
          )}
          Выйти
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:block">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Закрыть меню"
          />
          <aside className="relative h-full w-[min(84vw,320px)] animate-fade-up border-r border-line bg-white shadow-soft">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-5 grid size-10 place-items-center rounded-xl text-muted hover:bg-slate-100"
              aria-label="Закрыть меню"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6 lg:h-20 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid size-10 place-items-center rounded-xl border border-line bg-white text-ink lg:hidden"
              aria-label="Открыть меню"
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-sm font-bold text-ink sm:text-base">
                {pageTitles[pathname] || "Панель управления"}
              </p>
              <p className="hidden text-xs text-muted sm:block">Lumora · Москва</p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-slate-100 hover:text-ink"
          >
            На сайт
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
