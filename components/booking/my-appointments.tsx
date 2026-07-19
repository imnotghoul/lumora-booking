"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CalendarX2, CircleAlert, Clock3, Mail, MapPin, Phone, Search, Sparkles, UserRound } from "lucide-react";
import type { AppointmentDto } from "@/lib/types";
import { BUSINESS_TIME_ZONE } from "@/lib/business-timezone";
import { formatDuration, formatPrice, cn } from "@/lib/utils";
import { apiRequest } from "@/components/public/api-client";
import { SpecialistAvatar } from "@/components/public/specialist-card";
import { StatusBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Filter = "all" | "upcoming" | "past";

export function MyAppointments() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [searchError, setSearchError] = useState("");
  const [appointments, setAppointments] = useState<AppointmentDto[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [cancelTarget, setCancelTarget] = useState<AppointmentDto | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    try {
      const lastSearch = sessionStorage.getItem("lumora:last-search");
      if (lastSearch) {
        const parsed = JSON.parse(lastSearch) as { phone?: string; email?: string };
        setPhone(parsed.phone ?? "");
        setEmail(parsed.email ?? "");
        return;
      }
      const lastBooking = sessionStorage.getItem("lumora:last-booking");
      if (lastBooking) {
        const parsed = JSON.parse(lastBooking) as AppointmentDto;
        setPhone(parsed.client.phone);
        setEmail(parsed.client.email);
      }
    } catch {
      sessionStorage.removeItem("lumora:last-search");
    }
  }, []);

  const search = async (event?: FormEvent) => {
    event?.preventDefault();
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedPhone || !normalizedEmail) {
      setSearchError("Укажите телефон и email, которые оставляли при записи.");
      return;
    }
    if (normalizedPhone.replace(/\D/g, "").length < 10) {
      setSearchError("Проверьте номер телефона.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setSearchError("Проверьте email.");
      return;
    }
    setSearchError("");
    setRequestError("");
    setLoading(true);
    const params = new URLSearchParams();
    params.set("phone", normalizedPhone);
    params.set("email", normalizedEmail);
    try {
      const data = await apiRequest<AppointmentDto[]>(`/api/appointments/mine?${params.toString()}`);
      setAppointments(data.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()));
      setFilter("all");
      sessionStorage.setItem("lumora:last-search", JSON.stringify({ phone: normalizedPhone, email: normalizedEmail }));
    } catch (reason) {
      setAppointments(null);
      setRequestError(reason instanceof Error ? reason.message : "Не удалось найти записи.");
    } finally {
      setLoading(false);
    }
  };

  const visibleAppointments = useMemo(() => {
    if (!appointments) return [];
    const now = Date.now();
    return appointments.filter((appointment) => {
      if (filter === "all") return true;
      const future = new Date(appointment.endsAt).getTime() >= now && appointment.status !== "CANCELLED";
      return filter === "upcoming" ? future : !future;
    });
  }, [appointments, filter]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      const updated = await apiRequest<AppointmentDto>(`/api/appointments/${encodeURIComponent(cancelTarget.id)}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ phone: phone.trim(), email: email.trim().toLowerCase() }),
      });
      setAppointments((current) => current?.map((item) => item.id === updated.id ? updated : item) ?? null);
      setCancelTarget(null);
      toast({ tone: "success", title: "Запись отменена", description: "Это время снова доступно для записи." });
    } catch (reason) {
      setCancelError(reason instanceof Error ? reason.message : "Не удалось отменить запись.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-24">
        <span className="grid size-11 place-items-center rounded-xl bg-accent-50 text-accent-600"><Search className="size-5" aria-hidden /></span>
        <h2 className="mt-5 text-xl font-extrabold tracking-[-0.02em]">Найти записи</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Для защиты записей введите оба контакта точно так же, как при оформлении.</p>
        <form className="mt-6 grid gap-4" onSubmit={search} noValidate>
          <Field label="Телефон" required><div className="relative"><Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><Input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 999 123-45-67" className="pl-10" required /></div></Field>
          <Field label="Email" required><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><Input type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="anna@example.ru" className="pl-10" required /></div></Field>
          {searchError ? <p className="text-sm font-medium leading-5 text-danger" role="alert">{searchError}</p> : null}
          <Button type="submit" loading={loading}><Search className="size-4" />Найти записи</Button>
        </form>
        <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-muted">Совпадение телефона и email защищает записи от случайного доступа по одному известному контакту.</p>
      </aside>

      <section aria-live="polite" aria-busy={loading}>
        {loading ? <AppointmentsSkeleton /> : requestError ? <EmptyState icon={CircleAlert} title="Не удалось выполнить поиск" description={requestError} action={<Button onClick={() => search()}>Повторить</Button>} /> : appointments === null ? <WelcomeState /> : appointments.length === 0 ? <EmptyState icon={CalendarX2} title="Записи не нашлись" description="Проверьте контакты. Важно ввести их так же, как при оформлении." action={<Link href="/book" className={buttonStyles()}>Создать новую запись</Link>} /> : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-2xl font-extrabold tracking-[-0.025em]">Ваши записи</h2><p className="mt-1 text-sm text-muted">Найдено: {appointments.length}</p></div>
              <div className="flex rounded-xl border border-line bg-white p-1" role="group" aria-label="Фильтр записей">{([ ["all", "Все"], ["upcoming", "Будущие"], ["past", "История"] ] as const).map(([value, label]) => <button type="button" key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={cn("rounded-lg px-3 py-2 text-xs font-bold transition-colors", filter === value ? "bg-accent-600 text-white" : "text-muted hover:bg-slate-50 hover:text-ink")}>{label}</button>)}</div>
            </div>
            {visibleAppointments.length ? (
              <div className="mt-5 grid gap-4">
                {visibleAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={() => {
                      setCancelError("");
                      setCancelTarget(appointment);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  icon={CalendarDays}
                  title="В этом разделе пока пусто"
                  description={filter === "upcoming" ? "У вас нет предстоящих визитов." : "Здесь появятся завершённые и отменённые записи."}
                />
              </div>
            )}
          </>
        )}
      </section>

      <ConfirmDialog open={Boolean(cancelTarget)} title="Отменить запись?" description={cancelTarget ? `${cancelTarget.service.name}, ${formatDateTime(cancelTarget.startsAt)}. Это время станет доступно другим клиентам.` : ""} confirmLabel="Да, отменить" cancelLabel="Оставить запись" danger loading={cancelling} onConfirm={confirmCancel} onClose={() => { if (!cancelling) { setCancelTarget(null); setCancelError(""); } }} />
      {cancelError && cancelTarget ? <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-soft" role="alert"><p className="font-bold">Отменить запись не получилось</p><p className="mt-1">{cancelError}</p></div> : null}
    </div>
  );
}

function AppointmentCard({ appointment, onCancel }: { appointment: AppointmentDto; onCancel: () => void }) {
  const canCancel = (appointment.status === "NEW" || appointment.status === "CONFIRMED") && new Date(appointment.startsAt).getTime() > Date.now();
  return (
    <article className={cn("overflow-hidden rounded-2xl border bg-white shadow-card", appointment.status === "CANCELLED" ? "border-line opacity-75" : "border-line")}>
      <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center gap-2.5"><StatusBadge status={appointment.status} /><span className="font-mono text-xs font-bold tracking-wide text-muted">№ {appointment.bookingNumber}</span></div>
        <time className="text-sm font-extrabold text-ink" dateTime={appointment.startsAt}>{formatDateTime(appointment.startsAt)}</time>
      </div>
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 gap-4"><SpecialistAvatar specialist={appointment.specialist} className="size-14 rounded-xl text-sm" /><div className="min-w-0"><h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">{appointment.service.name}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><UserRound className="size-3.5 text-accent-500" aria-hidden />{appointment.specialist.name}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{formatDuration(appointment.service.duration)}</span><span className="flex items-center gap-1.5"><MapPin className="size-3.5" />Покровка, 12</span><strong className="text-ink">{formatPrice(appointment.service.price)}</strong></div></div></div>
        {canCancel ? <Button variant="outline" onClick={onCancel} className="w-full text-danger hover:border-red-200 hover:bg-red-50 md:w-auto"><CalendarX2 className="size-4" />Отменить</Button> : appointment.status === "CANCELLED" ? <span className="text-xs font-semibold text-muted">Время освобождено</span> : null}
      </div>
    </article>
  );
}

function WelcomeState() { return <div className="relative overflow-hidden rounded-3xl border border-line bg-white px-6 py-12 text-center shadow-card sm:px-10 sm:py-16"><div className="surface-grid pointer-events-none absolute inset-0" /><div className="relative"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent-50 text-accent-600"><CalendarDays className="size-7" /></span><h2 className="mt-6 text-2xl font-extrabold tracking-[-0.025em]">Все визиты в одном месте</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">Найдите свои записи, уточните дату и время или отмените визит, если планы изменились.</p><Link href="/book" className={cn(buttonStyles(), "mt-6")}><Sparkles className="size-4" />Создать новую запись</Link></div></div>; }
function AppointmentsSkeleton() { return <div role="status"><div className="flex justify-between"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-64" /></div><div className="mt-5 grid gap-4">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-48" />)}</div><span className="sr-only">Ищем записи…</span></div>; }
function formatDateTime(value: string) { const text = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: BUSINESS_TIME_ZONE }).format(new Date(value)); return text.replace(/^./, (letter) => letter.toUpperCase()); }
