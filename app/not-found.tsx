import Link from "next/link";
import { ArrowLeft, CalendarDays, Compass } from "lucide-react";
import { Brand } from "@/components/public/brand";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-white px-4 py-12">
      <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-96 -translate-x-1/2 rounded-full bg-accent-100/60 blur-3xl" aria-hidden />
      <div className="relative w-full max-w-xl text-center">
        <Brand className="justify-center" />
        <div className="mx-auto mt-10 grid size-20 place-items-center rounded-3xl border border-accent-100 bg-accent-50 text-accent-600 shadow-card"><Compass className="size-9" aria-hidden /></div>
        <p className="mt-7 text-sm font-extrabold uppercase tracking-[.22em] text-accent-600">404</p>
        <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-4xl">Здесь пока ничего нет</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted sm:text-base">Возможно, страница переехала или адрес был введён неверно. Вернёмся к знакомым маршрутам.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/" className={cn(buttonStyles({ size: "lg" }), "w-full sm:w-auto")}><ArrowLeft className="size-4" />На главную</Link><Link href="/book" className={cn(buttonStyles({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}><CalendarDays className="size-4" />Записаться</Link></div>
      </div>
    </main>
  );
}
