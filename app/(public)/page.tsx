import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, Check, Clock3, HeartHandshake, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import { HomeShowcase } from "@/components/public/home-showcase";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Онлайн-запись к специалистам",
  description: "Услуги красоты и заботы в Lumora. Выберите услугу, специалиста и удобное время онлайн.",
};

const benefits = [
  { icon: CalendarCheck2, title: "Запись за 2 минуты", text: "Видите только свободное время и сразу получаете подтверждение." },
  { icon: Users, title: "Проверенная команда", text: "Опытные мастера с вниманием к деталям и вашим пожеланиям." },
  { icon: ShieldCheck, title: "Без лишних звонков", text: "Найти, проверить и отменить свою запись можно самостоятельно." },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-white">
        <div className="surface-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="pointer-events-none absolute -right-32 -top-36 size-[34rem] rounded-full bg-accent-100/60 blur-3xl" aria-hidden />
        <div className="container-page relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3.5 py-2 text-xs font-bold text-accent-700">
              <Sparkles className="size-4" aria-hidden />
              Время, которое принадлежит вам
            </div>
            <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl">Забота о себе начинается <span className="text-accent-600">с одного клика</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">Выберите услугу, любимого специалиста и удобное время. Всё остальное мы возьмём на себя.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className={cn(buttonStyles({ size: "lg" }), "w-full sm:w-auto")} href="/book">Записаться онлайн<ArrowRight className="size-5" aria-hidden /></Link>
              <Link className={cn(buttonStyles({ variant: "outline", size: "lg" }), "w-full sm:w-auto")} href="/services">Выбрать услугу</Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Без предоплаты</span>
              <span className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden />Мгновенное подтверждение</span>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="border-y border-line bg-canvas" aria-label="О Lumora в цифрах">
        <div className="container-page grid grid-cols-2 divide-x divide-line py-7 md:grid-cols-4">
          {[ ["6", "услуг"], ["4", "специалиста"], ["4,9", "средняя оценка"], ["6 дней", "в неделю"] ].map(([value, label], index) => (
            <div key={label} className={cn("px-3 text-center sm:px-6", index > 1 && "mt-6 border-t border-line pt-6 md:mt-0 md:border-t-0 md:pt-0")}><strong className="block text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{value}</strong><span className="mt-1 block text-xs text-muted sm:text-sm">{label}</span></div>
          ))}
        </div>
      </section>

      <HomeShowcase />

      <section className="container-page py-16 sm:py-20" aria-labelledby="why-lumora">
        <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-accent-600">Просто и спокойно</p><h2 id="why-lumora" className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-ink">Ваши планы — под вашим контролем</h2></div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {benefits.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-line bg-white p-6 shadow-card"><span className="grid size-11 place-items-center rounded-xl bg-accent-50 text-accent-600"><Icon className="size-5" aria-hidden /></span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></article>)}
        </div>
      </section>

      <section className="container-page pb-16 sm:pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-10 text-white shadow-soft sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14 lg:py-12">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-accent-500/30 blur-3xl" aria-hidden />
          <div className="relative max-w-2xl"><HeartHandshake className="size-8 text-accent-300" aria-hidden /><h2 className="mt-5 text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">Найдём время для вас?</h2><p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">Расписание доступно круглосуточно. Запись займёт не больше пары минут.</p></div>
          <Link className={cn(buttonStyles({ size: "lg" }), "relative mt-7 w-full bg-white text-accent-700 hover:bg-accent-50 lg:mt-0 lg:w-auto")} href="/book">Перейти к записи<ArrowRight className="size-5" aria-hidden /></Link>
        </div>
      </section>
    </>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg pb-8 pt-4 lg:pb-0" aria-hidden>
      <div className="absolute left-0 top-12 h-64 w-64 rounded-full bg-accent-200/50 blur-3xl" />
      <div className="relative ml-auto w-[92%] rotate-1 rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_32px_80px_-28px_rgba(49,46,129,.38)] backdrop-blur sm:p-7">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent-600">Ваша запись</p><p className="mt-1 text-lg font-extrabold text-ink">Уход и красота</p></div><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-success"><CalendarCheck2 className="size-5" /></span></div>
        <div className="mt-6 grid grid-cols-5 gap-2">{["18", "19", "20", "21", "22"].map((day, index) => <div key={day} className={cn("rounded-xl px-1 py-3 text-center", index === 2 ? "bg-accent-600 text-white shadow-md shadow-accent-200" : "bg-slate-50 text-muted")}><span className="block text-[10px] font-bold">{["ПН", "ВТ", "СР", "ЧТ", "ПТ"][index]}</span><span className="mt-1 block text-sm font-extrabold">{day}</span></div>)}</div>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 text-sm font-extrabold text-white">АВ</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-ink">Алина Волкова</p><p className="text-xs text-muted">Стилист-колорист</p></div><span className="flex items-center gap-1 text-xs font-bold"><Star className="size-3.5 fill-amber-400 text-amber-400" />4,9</span></div></div>
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-accent-100 bg-accent-50/70 p-4"><div className="flex items-center gap-2 text-sm font-bold text-accent-800"><Clock3 className="size-4" />14:30–16:00</div><span className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-success">Свободно</span></div>
      </div>
      <div className="absolute -bottom-1 left-0 flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-soft sm:left-2"><span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-success"><Check className="size-4" /></span><div><p className="text-xs font-extrabold text-ink">Запись подтверждена</p><p className="mt-0.5 text-[11px] text-muted">Всё готово к вашему визиту</p></div></div>
    </div>
  );
}
