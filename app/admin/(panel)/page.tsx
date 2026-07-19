"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CircleX,
  Clock3,
  RussianRuble,
  Sparkles,
  UserPlus,
} from "lucide-react";
import type { AppointmentDto } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { AdminErrorState, AdminPageSkeleton } from "@/components/admin/admin-states";
import { adminRequest, getErrorMessage } from "@/components/admin/api";

type Stats = {
  todayAppointments: number;
  newClients: number;
  cancellations: number;
  revenue: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, appointmentsData] = await Promise.all([
        adminRequest<Stats>("/api/admin/stats"),
        adminRequest<AppointmentDto[]>("/api/admin/appointments"),
      ]);
      setStats(statsData);
      setAppointments(appointmentsData);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status !== "CANCELLED" &&
            new Date(appointment.startsAt).getTime() >= Date.now() - 30 * 60 * 1000,
        )
        .sort(
          (first, second) =>
            new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
        )
        .slice(0, 6),
    [appointments],
  );

  if (loading) return <AdminPageSkeleton />;
  if (error || !stats) return <AdminErrorState message={error} onRetry={load} />;

  const statCards = [
    {
      label: "Записей сегодня",
      value: stats.todayAppointments.toLocaleString("ru-RU"),
      note: "Все активные статусы",
      icon: CalendarCheck2,
      className: "bg-accent-50 text-accent-600",
    },
    {
      label: "Новые клиенты",
      value: stats.newClients.toLocaleString("ru-RU"),
      note: "Создано сегодня",
      icon: UserPlus,
      className: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Отмены",
      value: stats.cancellations.toLocaleString("ru-RU"),
      note: "Отменено сегодня",
      icon: CircleX,
      className: "bg-red-50 text-red-600",
    },
    {
      label: "Выручка",
      value: formatPrice(stats.revenue),
      note: "Завершённые записи за месяц",
      icon: RussianRuble,
      className: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Рабочее пространство"
        title="Добрый день!"
        description="Краткая сводка по записям и ближайшим визитам клиентов."
        icon={Sparkles}
        action={
          <Link
            href="/admin/appointments"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-700 sm:w-auto"
          >
            Управлять записями
            <ArrowRight className="size-4" />
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Статистика">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="overflow-hidden">
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{item.label}</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs text-muted">{item.note}</p>
                </div>
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${item.className}`}>
                  <Icon className="size-5" aria-hidden />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.7fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink">Ближайшие записи</h2>
              <p className="mt-1 text-sm text-muted">Следующие визиты по времени</p>
            </div>
            <Link href="/admin/appointments" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
              Все записи
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length ? (
              <div className="divide-y divide-line">
                {upcoming.map((appointment) => (
                  <div key={appointment.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white"
                        style={{ backgroundColor: appointment.specialist.color }}
                        aria-hidden
                      >
                        {appointment.specialist.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{appointment.client.name}</p>
                        <p className="truncate text-sm text-muted">
                          {appointment.service.name} · {appointment.specialist.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 pl-14 sm:block sm:pl-0 sm:text-right">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {formatDate(appointment.startsAt, "d MMM, HH:mm")}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">№ {appointment.bookingNumber}</p>
                      </div>
                      <div className="sm:mt-2"><StatusBadge status={appointment.status} /></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Ближайших записей нет"
                description="Новые записи клиентов появятся здесь автоматически."
                icon={CalendarClock}
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent-700 to-accent-500 text-white">
          <CardContent className="flex h-full min-h-72 flex-col">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/15">
              <Clock3 className="size-5" aria-hidden />
            </span>
            <p className="mt-6 text-sm font-semibold text-indigo-100">Быстрое действие</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Проверьте график команды</h2>
            <p className="mt-3 text-sm leading-6 text-indigo-100">
              Актуальное расписание помогает клиентам видеть только действительно свободное время.
            </p>
            <Link
              href="/admin/schedule"
              className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-accent-700 transition hover:bg-indigo-50"
            >
              Открыть расписание
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
