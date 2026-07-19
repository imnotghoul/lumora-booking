"use client";

import { useMemo, useState, type FormEvent } from "react";
import type {
  AppointmentDto,
  AppointmentStatus,
  ServiceDto,
  SpecialistDto,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { formatDuration, formatPrice } from "@/lib/utils";
import { moscowInputToIso, toMoscowDateTimeInput, todayInputValue } from "@/components/admin/date";

export type AppointmentPayload = {
  serviceId: string;
  specialistId: string;
  startsAt: string;
  client: { name: string; phone: string; email: string };
  notes?: string;
  status?: AppointmentStatus;
};

const statusOptions: Array<{ value: AppointmentStatus; label: string }> = [
  { value: "NEW", label: "Новая" },
  { value: "CONFIRMED", label: "Подтверждена" },
  { value: "COMPLETED", label: "Завершена" },
  { value: "CANCELLED", label: "Отменена" },
];

export function AppointmentForm({
  appointment,
  services,
  specialists,
  loading,
  serverErrors,
  onSubmit,
  onCancel,
}: {
  appointment?: AppointmentDto | null;
  services: ServiceDto[];
  specialists: SpecialistDto[];
  loading: boolean;
  serverErrors?: Record<string, string[]>;
  onSubmit: (payload: AppointmentPayload) => void;
  onCancel: () => void;
}) {
  const [serviceId, setServiceId] = useState(appointment?.service.id || "");
  const [specialistId, setSpecialistId] = useState(appointment?.specialist.id || "");
  const [startsAt, setStartsAt] = useState(
    appointment ? toMoscowDateTimeInput(appointment.startsAt) : "",
  );
  const [clientName, setClientName] = useState(appointment?.client.name || "");
  const [clientPhone, setClientPhone] = useState(appointment?.client.phone || "");
  const [clientEmail, setClientEmail] = useState(appointment?.client.email || "");
  const [notes, setNotes] = useState(appointment?.notes || "");
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status || "NEW");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableSpecialists = useMemo(
    () =>
      specialists.filter(
        (specialist) =>
          (specialist.active || specialist.id === appointment?.specialist.id) &&
          (!serviceId || specialist.serviceIds.includes(serviceId)),
      ),
    [appointment?.specialist.id, serviceId, specialists],
  );
  const selectedService = services.find((service) => service.id === serviceId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!serviceId) next.serviceId = "Выберите услугу";
    if (!specialistId) next.specialistId = "Выберите специалиста";
    if (!startsAt) next.startsAt = "Укажите дату и время";
    else if (!appointment && startsAt.slice(0, 10) < todayInputValue())
      next.startsAt = "Нельзя создать запись в прошлом";
    if (clientName.trim().length < 2) next.clientName = "Введите имя клиента";
    if (clientPhone.replace(/\D/g, "").length < 10)
      next.clientPhone = "Введите корректный номер телефона";
    if (!/^\S+@\S+\.\S+$/.test(clientEmail)) next.clientEmail = "Введите корректный email";
    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      serviceId,
      specialistId,
      startsAt: moscowInputToIso(startsAt),
      client: {
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim().toLowerCase(),
      },
      notes: notes.trim() || undefined,
      status,
    });
  }

  const fieldError = (name: string) =>
    errors[name] || serverErrors?.[name]?.[0] || serverErrors?.[`client.${name}`]?.[0];

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Услуга" required error={fieldError("serviceId")}>
          <Select
            value={serviceId}
            onChange={(event) => {
              const nextService = event.target.value;
              setServiceId(nextService);
              if (
                specialistId &&
                !specialists
                  .find((specialist) => specialist.id === specialistId)
                  ?.serviceIds.includes(nextService)
              ) {
                setSpecialistId("");
              }
            }}
            aria-invalid={Boolean(fieldError("serviceId"))}
          >
            <option value="">Выберите услугу</option>
            {services.filter((service) => service.active || service.id === serviceId).map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} · {formatPrice(service.price)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Специалист" required error={fieldError("specialistId")}>
          <Select
            value={specialistId}
            onChange={(event) => setSpecialistId(event.target.value)}
            disabled={!serviceId}
            aria-invalid={Boolean(fieldError("specialistId"))}
          >
            <option value="">{serviceId ? "Выберите специалиста" : "Сначала выберите услугу"}</option>
            {availableSpecialists.map((specialist) => (
              <option key={specialist.id} value={specialist.id}>
                {specialist.name} · {specialist.title}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {selectedService ? (
        <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-800">
          <span><strong>{formatDuration(selectedService.duration)}</strong> продолжительность</span>
          <span><strong>{formatPrice(selectedService.price)}</strong> стоимость</span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Дата и время"
          required
          hint="Часовой пояс: Москва (UTC+3)"
          error={fieldError("startsAt")}
        >
          <Input
            type="datetime-local"
            value={startsAt}
            min={appointment ? undefined : `${todayInputValue()}T00:00`}
            onChange={(event) => setStartsAt(event.target.value)}
            aria-invalid={Boolean(fieldError("startsAt"))}
          />
        </Field>
        {appointment ? (
          <Field label="Статус" required error={fieldError("status")}>
            <Select value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus)}>
              {statusOptions
                .filter(
                  (option) =>
                    option.value !== "CANCELLED" || appointment?.status === "CANCELLED",
                )
                .map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </Select>
          </Field>
        ) : null}
      </div>

      <fieldset className="space-y-4 rounded-2xl border border-line p-4 sm:p-5">
        <legend className="px-2 text-sm font-bold text-ink">Контакты клиента</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Имя" required error={fieldError("clientName") || fieldError("name")}>
            <Input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Анна Петрова" />
          </Field>
          <Field label="Телефон" required error={fieldError("clientPhone") || fieldError("phone")}>
            <Input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="+7 999 123-45-67" type="tel" />
          </Field>
        </div>
        <Field label="Email" required error={fieldError("clientEmail") || fieldError("email")}>
          <Input value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="client@example.ru" type="email" />
        </Field>
      </fieldset>

      <Field label="Комментарий" hint="Необязательно" error={fieldError("notes")}>
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Пожелания или важная информация о визите" maxLength={500} />
      </Field>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Отмена</Button>
        <Button type="submit" loading={loading}>{appointment ? "Сохранить изменения" : "Создать запись"}</Button>
      </div>
    </form>
  );
}
