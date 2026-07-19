"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarPlus, Check, CheckCircle2, Clock3, Copy, Home, MapPin, Sparkles, UserRound } from "lucide-react";
import type { AppointmentDto } from "@/lib/types";
import { BUSINESS_TIME_ZONE } from "@/lib/business-timezone";
import { formatDuration, formatPrice, cn } from "@/lib/utils";
import { buttonStyles, Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function BookingSuccess() {
  const searchParams = useSearchParams();
  const number = searchParams.get("number") ?? "";
  const [appointment, setAppointment] = useState<AppointmentDto | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("lumora:last-booking");
      if (!stored) return;
      const parsed = JSON.parse(stored) as AppointmentDto;
      if (!number || parsed.bookingNumber === number) setAppointment(parsed);
    } catch {
      sessionStorage.removeItem("lumora:last-booking");
    }
  }, [number]);

  const bookingNumber = appointment?.bookingNumber ?? number;
  const copyNumber = async () => {
    if (!bookingNumber) return;
    await navigator.clipboard.writeText(bookingNumber);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
    toast({ tone: "success", title: "Номер скопирован" });
  };

  const addToCalendar = () => {
    if (!appointment) return;
    const start = toIcsDate(appointment.startsAt);
    const end = toIcsDate(appointment.endsAt);
    const content = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lumora//Booking//RU", "BEGIN:VEVENT",
      `UID:${appointment.id}@lumora.ru`, `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
      `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${icsEscape(`${appointment.service.name} — Lumora`)}`,
      `DESCRIPTION:${icsEscape(`Запись ${appointment.bookingNumber}. Специалист: ${appointment.specialist.name}`)}`,
      `LOCATION:${icsEscape("Москва, ул. Покровка, 12")}`, "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `lumora-${appointment.bookingNumber}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ tone: "success", title: "Событие добавлено", description: "Файл календаря скачан." });
  };

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-50 text-success shadow-[0_0_0_12px_rgba(22,133,91,.06)]"><CheckCircle2 className="size-10" aria-hidden /></div>
      <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-success">Запись создана</p>
      <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-[-0.035em] text-ink sm:text-4xl">Готово — ждём вас в Lumora</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base">Мы закрепили выбранное время. Сохраните номер — он понадобится для управления записью.</p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-white text-left shadow-soft">
        <div className="flex flex-col gap-3 bg-gradient-to-r from-accent-600 to-accent-700 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div><p className="text-xs font-semibold text-accent-100">Номер записи</p><p className="mt-1 font-mono text-2xl font-extrabold tracking-wider">{bookingNumber || "—"}</p></div>
          {bookingNumber ? <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={copyNumber}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Скопировано" : "Скопировать"}</Button> : null}
        </div>
        {appointment ? (
          <div className="grid sm:grid-cols-2">
            <Detail icon={Sparkles} label="Услуга" value={appointment.service.name} detail={`${formatDuration(appointment.service.duration)} · ${formatPrice(appointment.service.price)}`} />
            <Detail icon={UserRound} label="Специалист" value={appointment.specialist.name} detail={appointment.specialist.title} />
            <Detail icon={Clock3} label="Дата и время" value={formatDateTime(appointment.startsAt)} detail="Время по Москве" />
            <Detail icon={MapPin} label="Адрес" value="ул. Покровка, 12" detail="Москва" />
          </div>
        ) : <p className="px-5 py-6 text-sm leading-6 text-muted sm:px-7">Детали записи остались в предыдущей сессии. Найдите их по телефону или email в разделе «Мои записи».</p>}
      </div>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        {appointment ? <Button onClick={addToCalendar}><CalendarPlus className="size-4" />Добавить в календарь</Button> : null}
        <Link href="/my-appointments" className={buttonStyles({ variant: appointment ? "outline" : "primary" })}>Мои записи</Link>
        <Link href="/" className={cn(buttonStyles({ variant: "ghost" }))}><Home className="size-4" />На главную</Link>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value, detail }: { icon: typeof Sparkles; label: string; value: string; detail: string }) {
  return <div className="flex gap-3 border-b border-line p-5 last:border-b-0 sm:p-6 sm:[&:nth-child(odd)]:border-r"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-600"><Icon className="size-4" /></span><div className="min-w-0"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-sm font-bold text-ink">{value}</p><p className="mt-0.5 text-xs text-muted">{detail}</p></div></div>;
}
function formatDateTime(value: string) { return new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: BUSINESS_TIME_ZONE }).format(new Date(value)); }
function toIcsDate(value: string) { return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
function icsEscape(value: string) { return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n"); }
