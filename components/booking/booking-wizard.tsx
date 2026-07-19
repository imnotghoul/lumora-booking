"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import type { AppointmentDto, ServiceDto, SpecialistDto } from "@/lib/types";
import { BUSINESS_TIME_ZONE } from "@/lib/business-timezone";
import { formatDuration, formatPrice, cn } from "@/lib/utils";
import { apiRequest, ApiClientError } from "@/components/public/api-client";
import { ServiceGlyph } from "@/components/public/service-card";
import { SpecialistAvatar } from "@/components/public/specialist-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

type Slot = { time: string; startsAt: string; endsAt: string };
type ContactData = { name: string; phone: string; email: string; notes: string };
type ContactErrors = Partial<Record<keyof ContactData, string>>;

const steps = [
  { label: "Услуга", short: "1" },
  { label: "Специалист", short: "2" },
  { label: "Дата и время", short: "3" },
  { label: "Контакты", short: "4" },
  { label: "Проверка", short: "5" },
];

export function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service") ?? "";
  const specialistParam = searchParams.get("specialist") ?? "";
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistDto[]>([]);
  const [preferredSpecialist, setPreferredSpecialist] = useState<SpecialistDto | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [specialistId, setSpecialistId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [contact, setContact] = useState<ContactData>({ name: "", phone: "", email: "", notes: "" });
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [slots, setSlots] = useState<Slot[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState("");
  const [specialistsLoading, setSpecialistsLoading] = useState(false);
  const [specialistsError, setSpecialistsError] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setInitialLoading(true);
    setInitialError("");
    Promise.all([
      apiRequest<ServiceDto[]>("/api/services", { signal: controller.signal }),
      apiRequest<SpecialistDto[]>("/api/specialists", { signal: controller.signal }),
    ]).then(([serviceData, specialistData]) => {
      if (!active) return;
      const activeServices = serviceData.filter((item) => item.active);
      const activeSpecialists = specialistData.filter((item) => item.active);
      setServices(activeServices);
      const deepLinkedService = activeServices.find((item) => item.id === serviceParam || item.slug === serviceParam);
      const deepLinkedSpecialist = activeSpecialists.find((item) => item.id === specialistParam || item.slug === specialistParam);
      if (deepLinkedSpecialist) setPreferredSpecialist(deepLinkedSpecialist);
      if (deepLinkedService) {
        setServiceId(deepLinkedService.id);
        if (deepLinkedSpecialist?.serviceIds.includes(deepLinkedService.id)) {
          setSpecialistId(deepLinkedSpecialist.id);
          setStep(2);
        } else {
          setStep(1);
        }
      }
    }).catch((reason: unknown) => {
      if (!active || (reason instanceof DOMException && reason.name === "AbortError")) return;
      setInitialError(reason instanceof Error ? reason.message : "Не удалось начать запись.");
    }).finally(() => {
      if (active) setInitialLoading(false);
    });
    return () => { active = false; controller.abort(); };
  }, [reload, serviceParam, specialistParam]);

  useEffect(() => {
    if (!serviceId) {
      setSpecialists([]);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setSpecialistsLoading(true);
    setSpecialistsError("");
    apiRequest<SpecialistDto[]>(`/api/specialists?serviceId=${encodeURIComponent(serviceId)}`, { signal: controller.signal })
      .then((data) => { if (active) setSpecialists(data.filter((item) => item.active)); })
      .catch((reason: unknown) => {
        if (!active || (reason instanceof DOMException && reason.name === "AbortError")) return;
        setSpecialistsError(reason instanceof Error ? reason.message : "Не удалось загрузить специалистов.");
      }).finally(() => { if (active) setSpecialistsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId || !specialistId || !date) {
      setSlots([]);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setSlotsLoading(true);
    setSlotsError("");
    setSlot(null);
    apiRequest<{ date: string; timezone: string; slots: Slot[] }>(`/api/availability?serviceId=${encodeURIComponent(serviceId)}&specialistId=${encodeURIComponent(specialistId)}&date=${date}`, { signal: controller.signal })
      .then((data) => { if (active) setSlots(data.slots); })
      .catch((reason: unknown) => {
        if (!active || (reason instanceof DOMException && reason.name === "AbortError")) return;
        setSlotsError(reason instanceof Error ? reason.message : "Не удалось узнать свободное время.");
      }).finally(() => { if (active) setSlotsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [date, serviceId, specialistId]);

  const selectedService = services.find((item) => item.id === serviceId) ?? null;
  const selectedSpecialist = specialists.find((item) => item.id === specialistId)
    ?? (preferredSpecialist?.id === specialistId ? preferredSpecialist : null);

  const chooseService = (id: string) => {
    const canKeepPreferred = preferredSpecialist?.serviceIds.includes(id) ?? false;
    setServiceId(id);
    setSpecialistId(canKeepPreferred && preferredSpecialist ? preferredSpecialist.id : "");
    setDate("");
    setSlot(null);
    setSubmitError("");
  };

  const chooseSpecialist = (id: string) => {
    setSpecialistId(id);
    setDate("");
    setSlot(null);
    setSubmitError("");
  };

  const validateContacts = () => {
    const errors: ContactErrors = {};
    if (contact.name.trim().length < 2) errors.name = "Укажите имя — минимум 2 символа.";
    const digits = contact.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) errors.phone = "Проверьте номер телефона.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) errors.email = "Укажите корректный email.";
    if (contact.notes.length > 500) errors.notes = "Комментарий не должен превышать 500 символов.";
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitContacts = (event: FormEvent) => {
    event.preventDefault();
    if (validateContacts()) setStep(4);
  };

  const submitBooking = async () => {
    if (!serviceId || !specialistId || !slot || !validateContacts()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const appointment = await apiRequest<AppointmentDto>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          serviceId,
          specialistId,
          startsAt: slot.startsAt,
          client: { name: contact.name.trim(), phone: contact.phone.trim(), email: contact.email.trim().toLowerCase() },
          notes: contact.notes.trim() || undefined,
        }),
      });
      sessionStorage.setItem("lumora:last-booking", JSON.stringify(appointment));
      router.push(`/book/success?number=${encodeURIComponent(appointment.bookingNumber)}`);
    } catch (reason) {
      if (reason instanceof ApiClientError && reason.fieldErrors) {
        const errors: ContactErrors = {};
        const fieldMap: Record<string, keyof ContactData> = { "client.name": "name", "client.phone": "phone", "client.email": "email", notes: "notes", name: "name", phone: "phone", email: "email" };
        Object.entries(reason.fieldErrors).forEach(([key, messages]) => {
          const target = fieldMap[key];
          if (target && messages[0]) errors[target] = messages[0];
        });
        if (Object.keys(errors).length) {
          setContactErrors(errors);
          setStep(3);
        }
      }
      setSubmitError(reason instanceof Error ? reason.message : "Не удалось создать запись. Попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) return <BookingSkeleton />;
  if (initialError) return <EmptyState icon={CircleAlert} title="Запись временно недоступна" description={initialError} action={<Button onClick={() => setReload((value) => value + 1)}>Повторить</Button>} />;
  if (!services.length) return <EmptyState icon={Sparkles} title="Нет услуг для записи" description="Мы обновляем каталог. Пожалуйста, загляните позже." />;

  return (
    <div>
      <BookingProgress step={step} onStepBack={setStep} />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 overflow-hidden">
          <CardContent className="p-5 sm:p-7">
            {step === 0 ? <ServiceStep services={services} selectedId={serviceId} preferredSpecialist={preferredSpecialist} onSelect={chooseService} /> : null}
            {step === 1 ? <SpecialistStep specialists={specialists} selectedId={specialistId} loading={specialistsLoading} error={specialistsError} onSelect={chooseSpecialist} /> : null}
            {step === 2 ? <DateTimeStep date={date} slot={slot} slots={slots} loading={slotsLoading} error={slotsError} onDate={setDate} onSlot={setSlot} /> : null}
            {step === 3 ? <ContactStep contact={contact} errors={contactErrors} onChange={setContact} onSubmit={submitContacts} onBack={() => setStep(2)} /> : null}
            {step === 4 ? <ReviewStep service={selectedService} specialist={selectedSpecialist} slot={slot} contact={contact} /> : null}

            {submitError ? <div className="mt-6 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden /><div><p className="font-bold">Не получилось завершить запись</p><p className="mt-1 leading-5">{submitError}</p>{step === 4 ? <button type="button" className="mt-2 font-bold underline underline-offset-4" onClick={() => setStep(2)}>Выбрать другое время</button> : null}</div></div> : null}

            {step !== 3 ? (
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                {step > 0 ? <Button variant="ghost" onClick={() => { setSubmitError(""); setStep((value) => value - 1); }}><ArrowLeft className="size-4" aria-hidden />Назад</Button> : <span />}
                {step < 4 ? (
                  <Button onClick={() => setStep((value) => value + 1)} disabled={(step === 0 && !serviceId) || (step === 1 && !specialistId) || (step === 2 && !slot)}>Продолжить<ArrowRight className="size-4" aria-hidden /></Button>
                ) : (
                  <Button onClick={submitBooking} loading={submitting}><CheckCircle2 className="size-4" aria-hidden />Подтвердить запись</Button>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <BookingSummary service={selectedService} specialist={selectedSpecialist} date={date} slot={slot} />
      </div>
    </div>
  );
}

function BookingProgress({ step, onStepBack }: { step: number; onStepBack: (step: number) => void }) {
  return (
    <nav aria-label="Шаги записи" className="overflow-x-auto pb-2">
      <ol className="flex min-w-[620px] items-center rounded-2xl border border-line bg-white px-4 py-4 shadow-card sm:px-6">
        {steps.map((item, index) => (
          <li key={item.label} className="flex flex-1 items-center last:flex-none" aria-current={index === step ? "step" : undefined}>
            <button type="button" onClick={() => index < step && onStepBack(index)} disabled={index >= step} className="group flex items-center gap-2.5 rounded-lg disabled:cursor-default">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border text-xs font-extrabold transition-colors", index < step ? "border-accent-600 bg-accent-600 text-white" : index === step ? "border-accent-600 bg-accent-50 text-accent-700" : "border-line bg-slate-50 text-muted")}>
                {index < step ? <Check className="size-4" aria-hidden /> : item.short}
              </span>
              <span className={cn("whitespace-nowrap text-xs font-bold", index === step ? "text-ink" : "text-muted")}>{item.label}</span>
            </button>
            {index < steps.length - 1 ? <span className={cn("mx-3 h-px flex-1", index < step ? "bg-accent-300" : "bg-line")} aria-hidden /> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StepHeading({ icon: Icon, eyebrow, title, description }: { icon: typeof Sparkles; eyebrow: string; title: string; description: string }) {
  return <div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-600"><Icon className="size-5" aria-hidden /></span><div><p className="text-xs font-bold uppercase tracking-[.15em] text-accent-600">{eyebrow}</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p></div></div>;
}

function ServiceStep({ services, selectedId, preferredSpecialist, onSelect }: { services: ServiceDto[]; selectedId: string; preferredSpecialist: SpecialistDto | null; onSelect: (id: string) => void }) {
  const available = preferredSpecialist ? services.filter((service) => preferredSpecialist.serviceIds.includes(service.id)) : services;
  return <section><StepHeading icon={Sparkles} eyebrow="Шаг 1 из 5" title="Что хотите запланировать?" description="Выберите одну услугу. Её длительность будет учтена при поиске свободного времени." />{preferredSpecialist ? <div className="mt-6 flex items-center gap-3 rounded-xl border border-accent-100 bg-accent-50 p-3.5"><SpecialistAvatar specialist={preferredSpecialist} className="size-10 rounded-xl text-xs" /><p className="text-sm text-accent-900">Вы выбрали <strong>{preferredSpecialist.name}</strong>. Показываем его услуги.</p></div> : null}<div className="mt-7 grid gap-3 sm:grid-cols-2">{available.map((service) => <button key={service.id} type="button" onClick={() => onSelect(service.id)} aria-pressed={selectedId === service.id} className={cn("flex min-h-32 items-start gap-4 rounded-2xl border p-4 text-left transition", selectedId === service.id ? "border-accent-500 bg-accent-50 shadow-[0_0_0_3px_rgba(99,102,241,.1)]" : "border-line bg-white hover:border-accent-200 hover:bg-slate-50")}><span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", selectedId === service.id ? "bg-accent-600 text-white" : "bg-accent-50 text-accent-600")}><ServiceGlyph icon={service.icon} /></span><span className="min-w-0 flex-1"><span className="block font-bold text-ink">{service.name}</span><span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted"><span>{formatDuration(service.duration)}</span><strong className="text-ink">{formatPrice(service.price)}</strong></span><span className="mt-2 line-clamp-2 block text-xs leading-5 text-muted">{service.description}</span></span>{selectedId === service.id ? <CheckCircle2 className="size-5 shrink-0 text-accent-600" aria-hidden /> : null}</button>)}</div></section>;
}

function SpecialistStep({ specialists, selectedId, loading, error, onSelect }: { specialists: SpecialistDto[]; selectedId: string; loading: boolean; error: string; onSelect: (id: string) => void }) {
  return <section><StepHeading icon={Users} eyebrow="Шаг 2 из 5" title="К кому хотите записаться?" description="Все специалисты ниже выполняют выбранную услугу." />{loading ? <ChoiceSkeleton /> : error ? <div className="mt-7"><EmptyState icon={CircleAlert} title="Не удалось показать команду" description={error} /></div> : specialists.length ? <div className="mt-7 grid gap-3 sm:grid-cols-2">{specialists.map((specialist) => <button key={specialist.id} type="button" onClick={() => onSelect(specialist.id)} aria-pressed={selectedId === specialist.id} className={cn("relative flex min-h-32 items-center gap-4 rounded-2xl border p-4 text-left transition", selectedId === specialist.id ? "border-accent-500 bg-accent-50 shadow-[0_0_0_3px_rgba(99,102,241,.1)]" : "border-line hover:border-accent-200 hover:bg-slate-50")}><SpecialistAvatar specialist={specialist} className="size-16 rounded-2xl text-base" /><span className="min-w-0 flex-1"><span className="block font-bold text-ink">{specialist.name}</span><span className="mt-1 block text-xs font-medium text-accent-700">{specialist.title}</span><span className="mt-2 flex items-center gap-3 text-xs text-muted"><span className="flex items-center gap-1 font-bold text-ink"><Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />{specialist.rating.toFixed(1)}</span><span>{specialist.experience} лет опыта</span></span></span>{selectedId === specialist.id ? <CheckCircle2 className="absolute right-3 top-3 size-5 text-accent-600" aria-hidden /> : null}</button>)}</div> : <div className="mt-7"><EmptyState icon={Users} title="Нет свободных специалистов" description="Вернитесь назад и выберите другую услугу." /></div>}</section>;
}

function DateTimeStep({ date, slot, slots, loading, error, onDate, onSlot }: { date: string; slot: Slot | null; slots: Slot[]; loading: boolean; error: string; onDate: (date: string) => void; onSlot: (slot: Slot) => void }) {
  const dates = useMemo(() => buildDateOptions(), []);
  return <section><StepHeading icon={CalendarDays} eyebrow="Шаг 3 из 5" title="Когда вам удобно?" description="Выберите дату, затем один из свободных интервалов. Время указано по Москве." /><div className="mt-7"><h3 className="text-sm font-bold text-ink">Дата</h3><div className="mt-3 flex gap-2 overflow-x-auto pb-3">{dates.map((item) => <button type="button" key={item.value} onClick={() => onDate(item.value)} aria-pressed={date === item.value} className={cn("min-w-[76px] rounded-xl border px-3 py-3 text-center transition", date === item.value ? "border-accent-600 bg-accent-600 text-white shadow-md shadow-accent-200" : "border-line bg-white hover:border-accent-300 hover:bg-accent-50")}><span className={cn("block text-[10px] font-bold uppercase tracking-wider", date === item.value ? "text-accent-100" : "text-muted")}>{item.weekday}</span><span className="mt-1 block text-xl font-extrabold">{item.day}</span><span className={cn("mt-0.5 block text-xs", date === item.value ? "text-accent-100" : "text-muted")}>{item.month}</span></button>)}</div></div><div className="mt-5 border-t border-line pt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-ink">Свободное время</h3><span className="flex items-center gap-1.5 text-xs text-muted"><Clock3 className="size-3.5" aria-hidden />МСК (UTC+3)</span></div>{!date ? <div className="mt-4 rounded-xl bg-slate-50 p-5 text-center text-sm text-muted">Сначала выберите дату</div> : loading ? <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">{Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="h-11" />)}</div> : error ? <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert"><CircleAlert className="size-5 shrink-0" />{error}</div> : slots.length ? <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">{slots.map((item) => <button type="button" key={item.startsAt} onClick={() => onSlot(item)} aria-pressed={slot?.startsAt === item.startsAt} className={cn("h-11 rounded-xl border text-sm font-bold transition", slot?.startsAt === item.startsAt ? "border-accent-600 bg-accent-600 text-white" : "border-line bg-white text-ink hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700")}>{item.time}</button>)}</div> : <div className="mt-4"><EmptyState icon={CalendarDays} title="На эту дату всё занято" description="Выберите соседний день — мы покажем доступное время." /></div>}</div></section>;
}

function ContactStep({ contact, errors, onChange, onSubmit, onBack }: { contact: ContactData; errors: ContactErrors; onChange: (data: ContactData) => void; onSubmit: (event: FormEvent) => void; onBack: () => void }) {
  const update = (key: keyof ContactData, value: string) => onChange({ ...contact, [key]: value });
  return <section><StepHeading icon={UserRound} eyebrow="Шаг 4 из 5" title="Как с вами связаться?" description="Мы используем контакты только для подтверждения и управления записью." /><form className="mt-7 grid gap-5" onSubmit={onSubmit} noValidate><Field label="Имя" required error={errors.name}><Input value={contact.name} onChange={(event) => update("name", event.target.value)} placeholder="Например, Анна" autoComplete="name" maxLength={80} aria-invalid={Boolean(errors.name)} /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Телефон" required error={errors.phone} hint="Пример: +7 999 123-45-67"><Input type="tel" inputMode="tel" value={contact.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+7 999 123-45-67" autoComplete="tel" maxLength={24} aria-invalid={Boolean(errors.phone)} /></Field><Field label="Email" required error={errors.email} hint="На него придёт номер записи"><Input type="email" inputMode="email" value={contact.email} onChange={(event) => update("email", event.target.value)} placeholder="anna@example.ru" autoComplete="email" maxLength={120} aria-invalid={Boolean(errors.email)} /></Field></div><Field label="Комментарий" error={errors.notes} hint={`${contact.notes.length}/500 — необязательно`}><Textarea value={contact.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Пожелания или важная информация для специалиста" maxLength={500} aria-invalid={Boolean(errors.notes)} /></Field><div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"><Button type="button" variant="ghost" onClick={onBack}><ArrowLeft className="size-4" />Назад</Button><p className="hidden max-w-xs items-center gap-2 text-xs leading-5 text-muted lg:flex"><ShieldCheck className="size-4 shrink-0 text-success" aria-hidden />Данные защищены и не передаются третьим лицам</p><Button type="submit">Проверить запись<ArrowRight className="size-4" /></Button></div></form></section>;
}

function ReviewStep({ service, specialist, slot, contact }: { service: ServiceDto | null; specialist: SpecialistDto | null; slot: Slot | null; contact: ContactData }) {
  return <section><StepHeading icon={CheckCircle2} eyebrow="Шаг 5 из 5" title="Всё верно?" description="Проверьте детали. После подтверждения мы сразу закрепим это время за вами." /><div className="mt-7 overflow-hidden rounded-2xl border border-line"><ReviewRow icon={Sparkles} label="Услуга" value={service?.name ?? "—"} detail={service ? `${formatDuration(service.duration)} · ${formatPrice(service.price)}` : undefined} /><ReviewRow icon={Users} label="Специалист" value={specialist?.name ?? "—"} detail={specialist?.title} /><ReviewRow icon={CalendarDays} label="Дата и время" value={slot ? formatSlotDate(slot.startsAt) : "—"} detail={slot ? `${slot.time} МСК` : undefined} /><ReviewRow icon={UserRound} label="Клиент" value={contact.name} detail={`${contact.phone} · ${contact.email}`} last /></div>{contact.notes ? <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">Комментарий</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">{contact.notes}</p></div> : null}<div className="mt-5 flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900"><ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden /><p className="leading-6">Нажимая «Подтвердить», вы соглашаетесь на обработку контактных данных для оформления записи.</p></div></section>;
}

function ReviewRow({ icon: Icon, label, value, detail, last = false }: { icon: typeof Sparkles; label: string; value: string; detail?: string; last?: boolean }) {
  return <div className={cn("flex items-start gap-4 p-4 sm:p-5", !last && "border-b border-line")}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-600"><Icon className="size-4" aria-hidden /></span><div className="min-w-0"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 break-words text-sm font-bold text-ink">{value}</p>{detail ? <p className="mt-0.5 break-words text-xs text-muted">{detail}</p> : null}</div></div>;
}

function BookingSummary({ service, specialist, date, slot }: { service: ServiceDto | null; specialist: SpecialistDto | null; date: string; slot: Slot | null }) {
  return <aside className="sticky top-24 hidden rounded-2xl border border-line bg-white p-5 shadow-card lg:block" aria-label="Текущий выбор"><div className="flex items-center justify-between"><h2 className="font-extrabold text-ink">Ваша запись</h2><Badge tone="accent">Черновик</Badge></div><div className="mt-5 grid gap-4">{service ? <SummaryLine icon={Sparkles} label="Услуга" value={service.name} /> : <SummaryPlaceholder label="Услуга не выбрана" />}{specialist ? <SummaryLine icon={Users} label="Специалист" value={specialist.name} /> : <SummaryPlaceholder label="Специалист не выбран" />}{slot ? <SummaryLine icon={CalendarDays} label="Дата и время" value={`${shortDate(date)}, ${slot.time}`} /> : <SummaryPlaceholder label="Время не выбрано" />}</div>{service ? <div className="mt-5 flex items-end justify-between border-t border-line pt-5"><div><p className="text-xs text-muted">Длительность</p><p className="mt-1 text-sm font-semibold">{formatDuration(service.duration)}</p></div><div className="text-right"><p className="text-xs text-muted">К оплате в студии</p><p className="mt-1 text-xl font-extrabold">{formatPrice(service.price)}</p></div></div> : null}<p className="mt-5 flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />Время будет забронировано только после подтверждения.</p></aside>;
}

function SummaryLine({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return <div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-600"><Icon className="size-4" /></span><div className="min-w-0"><p className="text-[11px] text-muted">{label}</p><p className="mt-0.5 truncate text-sm font-bold text-ink">{value}</p></div></div>;
}
function SummaryPlaceholder({ label }: { label: string }) { return <div className="flex items-center gap-3 text-xs text-slate-400"><span className="size-9 rounded-lg border border-dashed border-slate-300 bg-slate-50" />{label}</div>; }
function ChoiceSkeleton() { return <div className="mt-7 grid gap-3 sm:grid-cols-2" role="status">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32" />)}<span className="sr-only">Загружаем специалистов…</span></div>; }
function BookingSkeleton() { return <div role="status"><Skeleton className="h-20 w-full" /><div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><Skeleton className="h-[560px]" /><Skeleton className="hidden h-80 lg:block" /></div><span className="sr-only">Загружаем форму записи…</span></div>; }

function buildDateOptions() {
  const today = moscowToday();
  const base = new Date(`${today}T12:00:00Z`);
  return Array.from({ length: 14 }, (_, offset) => {
    const valueDate = new Date(base);
    valueDate.setUTCDate(base.getUTCDate() + offset);
    const value = valueDate.toISOString().slice(0, 10);
    const displayDate = new Date(`${value}T12:00:00Z`);
    return {
      value,
      weekday: new Intl.DateTimeFormat("ru-RU", { weekday: "short", timeZone: "UTC" }).format(displayDate).replace(".", ""),
      day: new Intl.DateTimeFormat("ru-RU", { day: "numeric", timeZone: "UTC" }).format(displayDate),
      month: new Intl.DateTimeFormat("ru-RU", { month: "short", timeZone: "UTC" }).format(displayDate).replace(".", ""),
    };
  });
}

function moscowToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shortDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function formatSlotDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: BUSINESS_TIME_ZONE }).format(new Date(value));
}
