"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  Check,
  Clock3,
  Copy,
  RotateCcw,
  Save,
  UserRound,
} from "lucide-react";
import type { ScheduleDto, SpecialistDto } from "@/lib/types";
import { BUSINESS_TIME_ZONE, BUSINESS_TIME_ZONE_LABEL } from "@/lib/business-timezone";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/admin/page-header";
import { AdminErrorState, AdminPageSkeleton } from "@/components/admin/admin-states";
import { adminRequest, getErrorMessage } from "@/components/admin/api";

type ScheduleRow = Omit<ScheduleDto, "id" | "specialistId">;

const days = [
  { dayOfWeek: 1, label: "Понедельник", short: "Пн" },
  { dayOfWeek: 2, label: "Вторник", short: "Вт" },
  { dayOfWeek: 3, label: "Среда", short: "Ср" },
  { dayOfWeek: 4, label: "Четверг", short: "Чт" },
  { dayOfWeek: 5, label: "Пятница", short: "Пт" },
  { dayOfWeek: 6, label: "Суббота", short: "Сб" },
  { dayOfWeek: 0, label: "Воскресенье", short: "Вс" },
];

function defaultSchedule(): ScheduleRow[] {
  return days.map(({ dayOfWeek }) => ({
    dayOfWeek,
    startTime: "09:00",
    endTime: dayOfWeek === 6 || dayOfWeek === 0 ? "17:00" : "18:00",
    isWorking: dayOfWeek !== 6 && dayOfWeek !== 0,
  }));
}

function normalizeSchedules(items: ScheduleDto[]): ScheduleRow[] {
  const defaults = defaultSchedule();
  return days.map(({ dayOfWeek }) => {
    const item = items.find((schedule) => schedule.dayOfWeek === dayOfWeek);
    return item
      ? {
          dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          isWorking: item.isWorking,
        }
      : defaults.find((schedule) => schedule.dayOfWeek === dayOfWeek)!;
  });
}

export default function AdminSchedulePage() {
  const { toast } = useToast();
  const [specialists, setSpecialists] = useState<SpecialistDto[]>([]);
  const [specialistId, setSpecialistId] = useState("");
  const [schedule, setSchedule] = useState<ScheduleRow[]>(defaultSchedule());
  const [savedSchedule, setSavedSchedule] = useState<ScheduleRow[]>(defaultSchedule());
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [pendingSpecialist, setPendingSpecialist] = useState<string | null>(null);
  const scheduleRequestRef = useRef(0);

  const dirty = JSON.stringify(schedule) !== JSON.stringify(savedSchedule);

  const loadSchedule = useCallback(async (id: string) => {
    const requestId = ++scheduleRequestRef.current;
    if (!id) return;
    setScheduleLoading(true);
    setError("");
    try {
      const data = await adminRequest<ScheduleDto[]>(`/api/admin/schedules?specialistId=${encodeURIComponent(id)}`);
      if (scheduleRequestRef.current !== requestId) return;
      const normalized = normalizeSchedules(data);
      setSchedule(normalized);
      setSavedSchedule(normalized);
      setFieldErrors({});
    } catch (loadError) {
      if (scheduleRequestRef.current !== requestId) return;
      setError(getErrorMessage(loadError));
    } finally {
      if (scheduleRequestRef.current === requestId) setScheduleLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminRequest<SpecialistDto[]>("/api/admin/specialists");
      setSpecialists(data);
      const firstId = data.find((specialist) => specialist.active)?.id || data[0]?.id || "";
      setSpecialistId(firstId);
      if (firstId) await loadSchedule(firstId);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [loadSchedule]);

  useEffect(() => { void load(); }, [load]);

  function updateRow(dayOfWeek: number, patch: Partial<ScheduleRow>) {
    setSchedule((current) =>
      current.map((row) => (row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row)),
    );
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[dayOfWeek];
      return next;
    });
  }

  function selectSpecialist(nextId: string) {
    if (nextId === specialistId) return;
    if (dirty) {
      setPendingSpecialist(nextId);
      return;
    }
    setSpecialistId(nextId);
    void loadSchedule(nextId);
  }

  function confirmSwitch() {
    if (!pendingSpecialist) return;
    const next = pendingSpecialist;
    setPendingSpecialist(null);
    setSpecialistId(next);
    void loadSchedule(next);
  }

  function copyMonday() {
    const monday = schedule.find((row) => row.dayOfWeek === 1);
    if (!monday) return;
    setSchedule((current) =>
      current.map((row) =>
        row.dayOfWeek >= 1 && row.dayOfWeek <= 5
          ? { ...row, startTime: monday.startTime, endTime: monday.endTime, isWorking: monday.isWorking }
          : row,
      ),
    );
    setFieldErrors({});
    toast({ tone: "info", title: "График понедельника скопирован", description: "Изменения применены к будним дням. Не забудьте сохранить." });
  }

  async function save() {
    const errors: Record<number, string> = {};
    schedule.forEach((row) => {
      if (row.isWorking && row.startTime >= row.endTime)
        errors[row.dayOfWeek] = "Начало должно быть раньше окончания";
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      toast({ tone: "error", title: "Проверьте время работы", description: "В графике есть некорректные интервалы." });
      return;
    }
    setSaving(true);
    try {
      const data = await adminRequest<ScheduleDto[]>("/api/admin/schedules", {
        method: "PUT",
        body: JSON.stringify({ specialistId, schedules: schedule }),
      });
      const normalized = normalizeSchedules(data);
      setSchedule(normalized);
      setSavedSchedule(normalized);
      toast({ tone: "success", title: "Расписание сохранено", description: "Свободные интервалы для клиентов пересчитаны." });
    } catch (saveError) {
      toast({ tone: "error", title: "Не удалось сохранить расписание", description: getErrorMessage(saveError) });
    } finally {
      setSaving(false);
    }
  }

  const selectedSpecialist = specialists.find((specialist) => specialist.id === specialistId);
  const weeklyHours = useMemo(
    () =>
      schedule.reduce((total, row) => {
        if (!row.isWorking) return total;
        const [startHour, startMinute] = row.startTime.split(":").map(Number);
        const [endHour, endMinute] = row.endTime.split(":").map(Number);
        return total + (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
      }, 0),
    [schedule],
  );

  if (loading) return <AdminPageSkeleton />;
  if (error && !specialists.length) return <AdminErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Доступность"
        title="Расписание"
        description="Настройте рабочие дни и часы. Свободные интервалы рассчитываются автоматически с учётом записей."
        icon={CalendarClock}
        action={<Button onClick={() => void save()} loading={saving} disabled={!specialistId || !dirty}><Save className="size-4" />Сохранить график</Button>}
      />

      {!specialists.length ? (
        <EmptyState title="Нет специалистов" description="Сначала добавьте специалиста, затем настройте его рабочую неделю." icon={UserRound} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
                <label className="grid flex-1 gap-2 text-sm font-semibold text-ink">
                  Специалист
                  <Select value={specialistId} onChange={(event) => selectSpecialist(event.target.value)}>
                    {specialists.map((specialist) => (
                      <option key={specialist.id} value={specialist.id}>{specialist.name}{specialist.active ? "" : " · неактивен"}</option>
                    ))}
                  </Select>
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyMonday} disabled={scheduleLoading}><Copy className="size-4" />Пн → будни</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSchedule(savedSchedule); setFieldErrors({}); }} disabled={!dirty}><RotateCcw className="size-4" />Отменить</Button>
                </div>
              </div>

              {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}

              {scheduleLoading ? (
                <div className="grid min-h-80 place-items-center" role="status">
                  <div className="text-center"><span className="mx-auto block size-7 animate-spin rounded-full border-2 border-accent-500 border-r-transparent" /><p className="mt-3 text-sm text-muted">Загружаем график…</p></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {days.map((day) => {
                    const row = schedule.find((item) => item.dayOfWeek === day.dayOfWeek)!;
                    return (
                      <div key={day.dayOfWeek} className={cn("grid gap-3 rounded-2xl border p-4 transition sm:grid-cols-[minmax(160px,1fr)_140px_24px_140px] sm:items-center", row.isWorking ? "border-line bg-white" : "border-transparent bg-slate-50")}>
                        <button type="button" onClick={() => updateRow(day.dayOfWeek, { isWorking: !row.isWorking })} className="flex items-center gap-3 text-left" aria-pressed={row.isWorking}>
                          <span className={cn("grid size-6 place-items-center rounded-lg border transition", row.isWorking ? "border-accent-600 bg-accent-600 text-white" : "border-slate-300 bg-white text-transparent")}><Check className="size-3.5" /></span>
                          <span><span className="block text-sm font-bold text-ink">{day.label}</span><span className="mt-0.5 block text-xs text-muted">{row.isWorking ? "Рабочий день" : "Выходной"}</span></span>
                        </button>
                        <Input type="time" value={row.startTime} onChange={(event) => updateRow(day.dayOfWeek, { startTime: event.target.value })} disabled={!row.isWorking} aria-label={`Начало работы, ${day.label}`} />
                        <span className="hidden text-center text-muted sm:block">—</span>
                        <Input type="time" value={row.endTime} onChange={(event) => updateRow(day.dayOfWeek, { endTime: event.target.value })} disabled={!row.isWorking} aria-label={`Окончание работы, ${day.label}`} />
                        {fieldErrors[day.dayOfWeek] ? <p className="text-xs font-medium text-danger sm:col-start-2 sm:col-end-5" role="alert">{fieldErrors[day.dayOfWeek]}</p> : null}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted">Часовой пояс: {BUSINESS_TIME_ZONE} · {BUSINESS_TIME_ZONE_LABEL}. Перерывы учитываются существующими записями.</p>
                <Button onClick={() => void save()} loading={saving} disabled={!dirty || scheduleLoading}><Save className="size-4" />Сохранить изменения</Button>
              </div>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl text-sm font-extrabold text-white" style={{ backgroundColor: selectedSpecialist?.color || "#5653e7" }}>{selectedSpecialist?.initials}</span>
                  <div><p className="font-bold text-ink">{selectedSpecialist?.name}</p><p className="text-sm text-muted">{selectedSpecialist?.title}</p></div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-extrabold text-ink">{schedule.filter((row) => row.isWorking).length}</p><p className="mt-1 text-xs text-muted">рабочих дней</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><p className="text-2xl font-extrabold text-ink">{Math.max(0, weeklyHours).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}</p><p className="mt-1 text-xs text-muted">часов в неделю</p></div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4"><span className="text-sm text-muted">Состояние</span><Badge tone={dirty ? "warning" : "success"}>{dirty ? "Есть изменения" : "Сохранено"}</Badge></div>
              </CardContent>
            </Card>

            <Card className="border-accent-100 bg-accent-50/60">
              <CardContent>
                <span className="grid size-10 place-items-center rounded-xl bg-white text-accent-600 shadow-sm"><Clock3 className="size-4" /></span>
                <h2 className="mt-4 font-bold text-ink">Как считаются слоты</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Система разбивает рабочее время с учётом длительности выбранной услуги и исключает уже занятые интервалы.</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingSpecialist)}
        title="Отменить несохранённые изменения?"
        description="Вы изменили график, но не сохранили его. При переходе к другому специалисту изменения будут потеряны."
        confirmLabel="Перейти без сохранения"
        danger
        onConfirm={confirmSwitch}
        onClose={() => setPendingSpecialist(null)}
      />
    </div>
  );
}
