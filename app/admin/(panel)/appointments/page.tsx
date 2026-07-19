"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  Edit3,
  List,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
  XCircle,
} from "lucide-react";
import type {
  AppointmentDto,
  AppointmentStatus,
  ServiceDto,
  SpecialistDto,
} from "@/lib/types";
import { cn, formatDuration, formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { AdminModal } from "@/components/admin/admin-modal";
import {
  AppointmentForm,
  type AppointmentPayload,
} from "@/components/admin/appointment-form";
import { AppointmentCalendar } from "@/components/admin/appointment-calendar";
import { PageHeader } from "@/components/admin/page-header";
import { AdminErrorState, AdminPageSkeleton } from "@/components/admin/admin-states";
import {
  AdminApiError,
  adminRequest,
  appendQuery,
  getErrorMessage,
} from "@/components/admin/api";
import { formatBusinessDate } from "@/components/admin/date";

type ViewMode = "list" | "calendar";

const statuses: Array<{ value: AppointmentStatus; label: string }> = [
  { value: "NEW", label: "Новая" },
  { value: "CONFIRMED", label: "Подтверждена" },
  { value: "COMPLETED", label: "Завершена" },
  { value: "CANCELLED", label: "Отменена" },
];

export default function AdminAppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistDto[]>([]);
  const [view, setView] = useState<ViewMode>("list");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [date, setDate] = useState("");
  const [specialistId, setSpecialistId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [status, setStatus] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<AppointmentDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | undefined>();
  const [cancelTarget, setCancelTarget] = useState<AppointmentDto | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);

  const loadOptions = useCallback(async () => {
    const [serviceData, specialistData] = await Promise.all([
      adminRequest<ServiceDto[]>("/api/admin/services"),
      adminRequest<SpecialistDto[]>("/api/admin/specialists"),
    ]);
    setServices(serviceData);
    setSpecialists(specialistData);
  }, []);

  const loadAppointments = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const data = await adminRequest<AppointmentDto[]>(
          appendQuery("/api/admin/appointments", {
            date: view === "list" ? date : undefined,
            specialistId,
            serviceId,
            status,
            search,
          }),
        );
        setAppointments(data);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [date, search, serviceId, specialistId, status, view],
  );

  useEffect(() => {
    void loadOptions().catch((loadError: unknown) => {
      setError(getErrorMessage(loadError));
    });
  }, [loadOptions]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (first, second) =>
          new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime(),
      ),
    [appointments],
  );

  function openCreate() {
    setSelected(null);
    setServerErrors(undefined);
    setModal("create");
  }

  function openEdit(appointment: AppointmentDto) {
    setSelected(appointment);
    setServerErrors(undefined);
    setModal("edit");
  }

  async function saveAppointment(payload: AppointmentPayload) {
    setSaving(true);
    setServerErrors(undefined);
    try {
      if (modal === "edit" && selected) {
        await adminRequest<AppointmentDto>(`/api/admin/appointments/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast({ tone: "success", title: "Запись обновлена" });
      } else {
        const created = await adminRequest<AppointmentDto>("/api/admin/appointments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({
          tone: "success",
          title: "Запись создана",
          description: `Номер записи: ${created.bookingNumber}`,
        });
      }
      setModal(null);
      await loadAppointments(true);
    } catch (saveError) {
      if (saveError instanceof AdminApiError) setServerErrors(saveError.fieldErrors);
      toast({
        tone: "error",
        title: "Не удалось сохранить запись",
        description: getErrorMessage(saveError),
      });
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(appointment: AppointmentDto, nextStatus: AppointmentStatus) {
    if (nextStatus === appointment.status) return;
    if (nextStatus === "CANCELLED") {
      setCancelTarget(appointment);
      return;
    }
    setStatusBusy(appointment.id);
    try {
      await adminRequest<AppointmentDto>(`/api/admin/appointments/${appointment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      toast({ tone: "success", title: "Статус записи изменён" });
      await loadAppointments(true);
    } catch (statusError) {
      toast({ tone: "error", title: "Не удалось изменить статус", description: getErrorMessage(statusError) });
    } finally {
      setStatusBusy(null);
    }
  }

  async function cancelAppointment() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await adminRequest<AppointmentDto>(`/api/admin/appointments/${cancelTarget.id}`, {
        method: "DELETE",
      });
      toast({
        tone: "success",
        title: "Запись отменена",
        description: "Время снова доступно для онлайн-записи.",
      });
      setCancelTarget(null);
      await loadAppointments(true);
    } catch (cancelError) {
      toast({ tone: "error", title: "Не удалось отменить запись", description: getErrorMessage(cancelError) });
    } finally {
      setCancelling(false);
    }
  }

  const hasFilters = Boolean(date || specialistId || serviceId || status || search);

  function resetFilters() {
    setDate("");
    setSpecialistId("");
    setServiceId("");
    setStatus("");
    setSearchDraft("");
    setSearch("");
  }

  if (loading) return <AdminPageSkeleton rows={6} />;
  if (error && !appointments.length) return <AdminErrorState message={error} onRetry={() => void loadAppointments()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Клиентский поток"
        title="Записи"
        description="Создавайте визиты, меняйте статусы и контролируйте загрузку команды."
        icon={CalendarDays}
        action={
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="size-4" aria-hidden />
            Новая запись
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <form
              className="relative flex-1"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchDraft.trim());
              }}
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Поиск по клиенту, телефону или номеру записи"
                className="pl-10 pr-24"
                aria-label="Поиск записей"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-lg bg-slate-100 px-3 text-xs font-bold text-muted hover:bg-slate-200 hover:text-ink">
                Найти
              </button>
            </form>
            <div className="flex rounded-xl border border-line bg-slate-50 p-1" role="group" aria-label="Вид записей">
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn("flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition xl:flex-none", view === "list" ? "bg-white text-ink shadow-sm" : "text-muted")}
                aria-pressed={view === "list"}
              >
                <List className="size-4" /> Список
              </button>
              <button
                type="button"
                onClick={() => setView("calendar")}
                className={cn("flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition xl:flex-none", view === "calendar" ? "bg-white text-ink shadow-sm" : "text-muted")}
                aria-pressed={view === "calendar"}
              >
                <CalendarRange className="size-4" /> Календарь
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {view === "list" ? (
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Фильтр по дате" />
            ) : (
              <div className="flex h-11 items-center gap-2 rounded-xl border border-line bg-slate-50 px-3.5 text-sm text-muted">
                <SlidersHorizontal className="size-4" /> Фильтры недели
              </div>
            )}
            <Select value={specialistId} onChange={(event) => setSpecialistId(event.target.value)} aria-label="Фильтр по специалисту">
              <option value="">Все специалисты</option>
              {specialists.map((specialist) => <option key={specialist.id} value={specialist.id}>{specialist.name}</option>)}
            </Select>
            <Select value={serviceId} onChange={(event) => setServiceId(event.target.value)} aria-label="Фильтр по услуге">
              <option value="">Все услуги</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </Select>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Фильтр по статусу">
              <option value="">Все статусы</option>
              {statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
            <Button variant="ghost" onClick={resetFilters} disabled={!hasFilters}>
              Сбросить фильтры
            </Button>
          </div>

          {refreshing ? (
            <div className="flex items-center gap-2 text-xs font-medium text-muted" role="status">
              <span className="size-3 animate-spin rounded-full border-2 border-accent-500 border-r-transparent" />
              Обновляем данные…
            </div>
          ) : null}
          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger" role="alert">{error}</p> : null}
        </CardContent>
      </Card>

      {view === "calendar" ? (
        <AppointmentCalendar
          appointments={sortedAppointments}
          date={calendarDate}
          onDateChange={setCalendarDate}
          onEdit={openEdit}
        />
      ) : sortedAppointments.length ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-4">Дата и время</th>
                  <th className="px-5 py-4">Клиент</th>
                  <th className="px-5 py-4">Услуга</th>
                  <th className="px-5 py-4">Специалист</th>
                  <th className="px-5 py-4">Статус</th>
                  <th className="px-5 py-4 text-right"><span className="sr-only">Действия</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sortedAppointments.map((appointment) => (
                  <tr key={appointment.id} className={cn("transition hover:bg-slate-50/60", appointment.status === "CANCELLED" && "opacity-65")}>
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="text-sm font-bold text-ink">{formatBusinessDate(appointment.startsAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      <p className="mt-1 text-xs text-muted">№ {appointment.bookingNumber}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-ink">{appointment.client.name}</p>
                      <p className="mt-1 text-xs text-muted">{appointment.client.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-ink">{appointment.service.name}</p>
                      <p className="mt-1 text-xs text-muted">{formatDuration(appointment.service.duration)} · {formatPrice(appointment.service.price)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: appointment.specialist.color }}>{appointment.specialist.initials}</span>
                        <span className="text-sm font-semibold text-ink">{appointment.specialist.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <label className="relative inline-flex items-center">
                        <span className="sr-only">Изменить статус</span>
                        {statusBusy === appointment.id ? (
                          <span className="size-5 animate-spin rounded-full border-2 border-accent-500 border-r-transparent" />
                        ) : (
                          <Select
                            className="h-9 min-w-44 py-0"
                            value={appointment.status}
                            onChange={(event) => void updateStatus(appointment, event.target.value as AppointmentStatus)}
                            disabled={statusBusy === appointment.id}
                          >
                            {statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </Select>
                        )}
                      </label>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(appointment)} aria-label={`Изменить запись ${appointment.bookingNumber}`}><Edit3 className="size-4" /></Button>
                        {appointment.status !== "CANCELLED" ? (
                          <Button size="icon" variant="ghost" className="hover:bg-red-50 hover:text-danger" onClick={() => setCancelTarget(appointment)} aria-label={`Отменить запись ${appointment.bookingNumber}`}><XCircle className="size-4" /></Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-line lg:hidden">
            {sortedAppointments.map((appointment) => (
              <article key={appointment.id} className={cn("p-4 sm:p-5", appointment.status === "CANCELLED" && "opacity-65")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">{formatBusinessDate(appointment.startsAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
                    <p className="mt-1 text-xs text-muted">№ {appointment.bookingNumber}</p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex items-center gap-2"><UserRound className="size-4 text-slate-400" /><span className="font-semibold text-ink">{appointment.client.name}</span></div>
                  <div className="flex items-center gap-2"><MoreHorizontal className="size-4 text-slate-400" /><span>{appointment.service.name} · {appointment.specialist.name}</span></div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
                    <a href={`tel:${appointment.client.phone}`} className="flex items-center gap-1.5 hover:text-accent-600"><Phone className="size-3.5" />{appointment.client.phone}</a>
                    <a href={`mailto:${appointment.client.email}`} className="flex items-center gap-1.5 hover:text-accent-600"><Mail className="size-3.5" />{appointment.client.email}</a>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" size="sm" variant="outline" onClick={() => openEdit(appointment)}><Edit3 className="size-4" />Изменить</Button>
                  {appointment.status !== "CANCELLED" ? (
                    <Button size="sm" variant="ghost" className="text-danger hover:bg-red-50" onClick={() => setCancelTarget(appointment)}><XCircle className="size-4" /><span className="sr-only sm:not-sr-only">Отменить</span></Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title={hasFilters ? "По фильтрам ничего не найдено" : "Записей пока нет"}
          description={hasFilters ? "Измените параметры поиска или сбросьте фильтры." : "Создайте первую запись вручную — она появится в общем расписании."}
          icon={CalendarDays}
          action={hasFilters ? <Button variant="outline" onClick={resetFilters}>Сбросить фильтры</Button> : <Button onClick={openCreate}><Plus className="size-4" />Новая запись</Button>}
        />
      )}

      <AdminModal
        open={modal !== null}
        onClose={() => !saving && setModal(null)}
        title={modal === "edit" ? "Изменить запись" : "Новая запись"}
        description={modal === "edit" && selected ? `Запись № ${selected.bookingNumber}` : "Заполните данные визита. Занятое время сервер не позволит сохранить."}
        size="lg"
      >
        {modal ? (
          <AppointmentForm
            key={`${modal}-${selected?.id || "new"}`}
            appointment={selected}
            services={services}
            specialists={specialists}
            loading={saving}
            serverErrors={serverErrors}
            onSubmit={(payload) => void saveAppointment(payload)}
            onCancel={() => setModal(null)}
          />
        ) : null}
      </AdminModal>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Отменить запись?"
        description={cancelTarget ? `${cancelTarget.client.name} получит отменённый статус, а время ${formatBusinessDate(cancelTarget.startsAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} снова станет доступно.` : ""}
        confirmLabel="Отменить запись"
        danger
        loading={cancelling}
        onConfirm={() => void cancelAppointment()}
        onClose={() => !cancelling && setCancelTarget(null)}
      />
    </div>
  );
}
