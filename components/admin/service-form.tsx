"use client";

import { useState, type FormEvent } from "react";
import type { ServiceDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ServiceGlyph } from "@/components/public/service-card";

export type ServicePayload = {
  name: string;
  slug?: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  icon?: string;
  featured: boolean;
  active: boolean;
};

const categories = ["Волосы", "Ногтевой сервис", "Косметология", "Массаж", "Брови и ресницы", "Другое"];
const iconOptions = [
  { value: "Sparkles", label: "Искры" },
  { value: "Scissors", label: "Ножницы" },
  { value: "Flower", label: "Цветок" },
  { value: "Wellness", label: "Здоровье" },
  { value: "Wand", label: "Волшебная палочка" },
];

export function ServiceForm({
  service,
  loading,
  serverErrors,
  onSubmit,
  onCancel,
}: {
  service?: ServiceDto | null;
  loading: boolean;
  serverErrors?: Record<string, string[]>;
  onSubmit: (payload: ServicePayload) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(service?.name || "");
  const [slug, setSlug] = useState(service?.slug || "");
  const [description, setDescription] = useState(service?.description || "");
  const [duration, setDuration] = useState(String(service?.duration || 60));
  const [price, setPrice] = useState(String(service?.price || ""));
  const [category, setCategory] = useState(service?.category || categories[0]);
  const [icon, setIcon] = useState(service?.icon || "Sparkles");
  const [featured, setFeatured] = useState(service?.featured ?? false);
  const [active, setActive] = useState(service?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Название должно содержать минимум 2 символа";
    if (description.trim().length < 10) next.description = "Добавьте описание от 10 символов";
    const durationNumber = Number(duration);
    if (
      !Number.isInteger(durationNumber) ||
      durationNumber < 15 ||
      durationNumber > 480 ||
      durationNumber % 15 !== 0
    )
      next.duration = "Укажите от 15 до 480 минут с шагом 15";
    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) next.price = "Укажите корректную стоимость";
    if (!category) next.category = "Выберите категорию";
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      next.slug = "Только латинские буквы, цифры и дефисы";
    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      duration: durationNumber,
      price: priceNumber,
      category,
      icon: icon.trim() || undefined,
      featured,
      active,
    });
  }

  const errorFor = (field: string) => errors[field] || serverErrors?.[field]?.[0];

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field label="Название" required error={errorFor("name")}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Например, стрижка и укладка" autoFocus />
        </Field>
        <Field label="Иконка" error={errorFor("icon")}>
          <span className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-accent-600"><ServiceGlyph icon={icon} className="size-4" /></span>
            <Select value={icon} onChange={(event) => setIcon(event.target.value)} className="pl-10">
              {!iconOptions.some((option) => option.value === icon) ? <option value={icon}>{icon}</option> : null}
              {iconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </span>
        </Field>
      </div>

      <Field label="Описание" required error={errorFor("description")}>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Коротко расскажите клиенту, что входит в услугу" maxLength={800} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Длительность, мин" required error={errorFor("duration")}>
          <Input type="number" min={15} max={480} step={15} value={duration} onChange={(event) => setDuration(event.target.value)} />
        </Field>
        <Field label="Стоимость, ₽" required error={errorFor("price")}>
          <Input type="number" min={0} step={100} value={price} onChange={(event) => setPrice(event.target.value)} placeholder="3500" />
        </Field>
        <Field label="Категория" required error={errorFor("category")}>
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="URL-идентификатор" hint="Можно оставить пустым — сформируется автоматически" error={errorFor("slug")}>
        <Input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} placeholder="haircut-styling" />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 transition hover:bg-slate-50">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="mt-0.5 size-4 accent-accent-600" />
          <span><span className="block text-sm font-semibold text-ink">Услуга активна</span><span className="mt-0.5 block text-xs leading-5 text-muted">Доступна клиентам для записи</span></span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 transition hover:bg-slate-50">
          <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className="mt-0.5 size-4 accent-accent-600" />
          <span><span className="block text-sm font-semibold text-ink">Рекомендуемая</span><span className="mt-0.5 block text-xs leading-5 text-muted">Показывать с приоритетом в каталоге</span></span>
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Отмена</Button>
        <Button type="submit" loading={loading}>{service ? "Сохранить изменения" : "Добавить услугу"}</Button>
      </div>
    </form>
  );
}
