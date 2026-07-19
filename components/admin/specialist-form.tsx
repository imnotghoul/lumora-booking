"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import type { ServiceDto, SpecialistDto } from "@/lib/types";
import { cn, initials as makeInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";

export type SpecialistPayload = {
  name: string;
  slug?: string;
  title: string;
  bio: string;
  experience: number;
  rating?: number;
  color?: string;
  initials?: string;
  active: boolean;
  serviceIds: string[];
};

export function SpecialistForm({
  specialist,
  services,
  loading,
  serverErrors,
  onSubmit,
  onCancel,
}: {
  specialist?: SpecialistDto | null;
  services: ServiceDto[];
  loading: boolean;
  serverErrors?: Record<string, string[]>;
  onSubmit: (payload: SpecialistPayload) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(specialist?.name || "");
  const [slug, setSlug] = useState(specialist?.slug || "");
  const [title, setTitle] = useState(specialist?.title || "");
  const [bio, setBio] = useState(specialist?.bio || "");
  const [experience, setExperience] = useState(String(specialist?.experience ?? 1));
  const [rating, setRating] = useState(String(specialist?.rating ?? 5));
  const [color, setColor] = useState(specialist?.color || "#5653e7");
  const [customInitials, setCustomInitials] = useState(specialist?.initials || "");
  const [active, setActive] = useState(specialist?.active ?? true);
  const [serviceIds, setServiceIds] = useState<string[]>(specialist?.serviceIds || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const previewInitials = useMemo(
    () => customInitials.trim().toUpperCase() || makeInitials(name || "Новый специалист"),
    [customInitials, name],
  );

  function toggleService(id: string) {
    setServiceIds((current) =>
      current.includes(id) ? current.filter((serviceId) => serviceId !== id) : [...current, id],
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Введите имя специалиста";
    if (title.trim().length < 2) next.title = "Укажите должность или специализацию";
    if (bio.trim().length < 20) next.bio = "Добавьте описание от 20 символов";
    const experienceNumber = Number(experience);
    if (!Number.isInteger(experienceNumber) || experienceNumber < 0 || experienceNumber > 70)
      next.experience = "Укажите стаж от 0 до 70 лет";
    const ratingNumber = Number(rating);
    if (!Number.isFinite(ratingNumber) || ratingNumber < 0 || ratingNumber > 5)
      next.rating = "Рейтинг должен быть от 0 до 5";
    if (!serviceIds.length) next.serviceIds = "Назначьте хотя бы одну услугу";
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      next.slug = "Только латинские буквы, цифры и дефисы";
    if (customInitials.trim().length > 4) next.initials = "Не более 4 символов";
    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      name: name.trim(),
      slug: slug.trim() || undefined,
      title: title.trim(),
      bio: bio.trim(),
      experience: experienceNumber,
      rating: ratingNumber,
      color,
      initials: previewInitials,
      active,
      serviceIds,
    });
  }

  const errorFor = (field: string) => errors[field] || serverErrors?.[field]?.[0];

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl text-lg font-extrabold text-white shadow-sm" style={{ backgroundColor: color }}>
          {previewInitials}
        </span>
        <div>
          <p className="text-sm font-bold text-ink">Предпросмотр профиля</p>
          <p className="mt-1 text-xs leading-5 text-muted">Цвет помогает быстро различать специалистов в календаре.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Имя и фамилия" required error={errorFor("name")}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Мария Волкова" autoFocus />
        </Field>
        <Field label="Должность" required error={errorFor("title")}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Стилист-колорист" />
        </Field>
      </div>

      <Field label="О специалисте" required error={errorFor("bio")}>
        <Textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Опыт, специализация и подход к работе" maxLength={1200} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Стаж, лет" required error={errorFor("experience")} className="sm:col-span-1">
          <Input type="number" min={0} max={70} value={experience} onChange={(event) => setExperience(event.target.value)} />
        </Field>
        <Field label="Рейтинг" error={errorFor("rating")} className="sm:col-span-1">
          <Input type="number" min={0} max={5} step={0.1} value={rating} onChange={(event) => setRating(event.target.value)} />
        </Field>
        <Field label="Инициалы" error={errorFor("initials")} className="sm:col-span-1">
          <Input value={customInitials} onChange={(event) => setCustomInitials(event.target.value.toUpperCase())} maxLength={4} placeholder={makeInitials(name || "И Ф")} />
        </Field>
        <Field label="Цвет" className="sm:col-span-1">
          <Input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="cursor-pointer p-1.5" />
        </Field>
      </div>

      <Field label="URL-идентификатор" hint="Можно оставить пустым — сформируется автоматически" error={errorFor("slug")}>
        <Input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} placeholder="maria-volkova" />
      </Field>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Услуги <span className="text-danger">*</span></legend>
        <p className="mt-1 text-xs text-muted">Клиент сможет выбрать специалиста только для отмеченных услуг.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {services.filter((service) => service.active || serviceIds.includes(service.id)).map((service) => {
            const checked = serviceIds.includes(service.id);
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition",
                  checked ? "border-accent-300 bg-accent-50 text-accent-800" : "border-line bg-white text-muted hover:border-slate-300",
                )}
                aria-pressed={checked}
              >
                <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border", checked ? "border-accent-600 bg-accent-600 text-white" : "border-slate-300 bg-white")}>
                  {checked ? <Check className="size-3" /> : null}
                </span>
                <span className="font-medium">{service.name}</span>
              </button>
            );
          })}
        </div>
        {errorFor("serviceIds") ? <p className="mt-2 text-xs font-medium text-danger" role="alert">{errorFor("serviceIds")}</p> : null}
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 transition hover:bg-slate-50">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="mt-0.5 size-4 accent-accent-600" />
        <span><span className="block text-sm font-semibold text-ink">Специалист активен</span><span className="mt-0.5 block text-xs leading-5 text-muted">Показывается клиентам и доступен для новых записей</span></span>
      </label>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Отмена</Button>
        <Button type="submit" loading={loading}>{specialist ? "Сохранить изменения" : "Добавить специалиста"}</Button>
      </div>
    </form>
  );
}
