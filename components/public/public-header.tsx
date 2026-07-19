"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Menu, X } from "lucide-react";
import { Brand } from "@/components/public/brand";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/services", label: "Услуги" },
  { href: "/specialists", label: "Специалисты" },
  { href: "/my-appointments", label: "Мои записи" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur-xl">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Brand />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-accent-50 text-accent-700" : "text-muted hover:bg-slate-50 hover:text-ink",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/book" className={cn(buttonStyles({ size: "md" }), "hidden sm:inline-flex")}>
            <CalendarDays className="size-4" aria-hidden />
            Записаться
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl border border-line bg-white text-ink lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div id="mobile-navigation" className="border-t border-line bg-white px-4 py-4 lg:hidden">
          <nav className="container-page grid gap-1 p-0" aria-label="Мобильная навигация">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("rounded-xl px-4 py-3 text-sm font-semibold", active ? "bg-accent-50 text-accent-700" : "text-ink hover:bg-slate-50")}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link href="/book" className={cn(buttonStyles({ size: "md" }), "mt-2 sm:hidden")}>
              <CalendarDays className="size-4" aria-hidden />
              Записаться
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
