"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AppointmentDto } from "@/lib/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addBusinessDays,
  businessDateKey,
  formatBusinessDate,
  isSameBusinessDay,
  startOfBusinessWeek,
} from "@/components/admin/date";

export function AppointmentCalendar({
  appointments,
  date,
  onDateChange,
  onEdit,
}: {
  appointments: AppointmentDto[];
  date: Date;
  onDateChange: (value: Date) => void;
  onEdit: (appointment: AppointmentDto) => void;
}) {
  const weekStart = startOfBusinessWeek(date);
  const weekEnd = addBusinessDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, index) => addBusinessDays(weekStart, index));

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-ink">
            {formatBusinessDate(weekStart, { day: "numeric", month: "long" })} — {formatBusinessDate(weekEnd, { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="mt-0.5 text-xs text-muted">Время указано по Москве</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onDateChange(addBusinessDays(date, -7))} aria-label="Предыдущая неделя">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>Сегодня</Button>
          <Button variant="outline" size="icon" onClick={() => onDateChange(addBusinessDays(date, 7))} aria-label="Следующая неделя">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[1050px] grid-cols-7 divide-x divide-line">
          {days.map((day) => {
            const dayAppointments = appointments
              .filter((appointment) => isSameBusinessDay(appointment.startsAt, day))
              .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
            const today = isSameBusinessDay(day, new Date());
            return (
              <section key={businessDateKey(day)} className="min-h-[520px] bg-slate-50/30" aria-label={formatBusinessDate(day, { weekday: "long", day: "numeric", month: "long" })}>
                <div className={cn("sticky top-0 z-10 border-b border-line bg-white px-3 py-3 text-center", today && "bg-accent-50")}>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">{formatBusinessDate(day, { weekday: "short" })}</p>
                  <span className={cn("mt-1 inline-grid size-8 place-items-center rounded-full text-sm font-bold", today ? "bg-accent-600 text-white" : "text-ink")}>
                    {formatBusinessDate(day, { day: "numeric" })}
                  </span>
                </div>
                <div className="space-y-2 p-2">
                  {dayAppointments.map((appointment) => (
                    <button
                      type="button"
                      key={appointment.id}
                      onClick={() => onEdit(appointment)}
                      className={cn(
                        "w-full rounded-xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-card",
                        appointment.status === "CANCELLED" && "opacity-55",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-ink">
                          {formatBusinessDate(appointment.startsAt, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="size-2 rounded-full" style={{ backgroundColor: appointment.specialist.color }} />
                      </div>
                      <p className="mt-2 truncate text-xs font-semibold text-ink">{appointment.client.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted">{appointment.service.name}</p>
                      <div className="mt-2 origin-left scale-90"><StatusBadge status={appointment.status} /></div>
                    </button>
                  ))}
                  {!dayAppointments.length ? <p className="py-6 text-center text-xs text-slate-400">Нет записей</p> : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
