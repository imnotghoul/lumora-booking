"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleAlert, Search, Users } from "lucide-react";
import type { ServiceDto, SpecialistDto } from "@/lib/types";
import { apiRequest } from "@/components/public/api-client";
import { SpecialistCard } from "@/components/public/specialist-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

export function SpecialistsCatalog() {
  const [specialists, setSpecialists] = useState<SpecialistDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [query, setQuery] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      apiRequest<SpecialistDto[]>("/api/specialists", { signal: controller.signal }),
      apiRequest<ServiceDto[]>("/api/services", { signal: controller.signal }),
    ]).then(([specialistData, serviceData]) => {
      setSpecialists(specialistData.filter((item) => item.active));
      setServices(serviceData.filter((item) => item.active));
    }).catch((reason: unknown) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить специалистов.");
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [reload]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru-RU");
    return specialists.filter((specialist) =>
      (!serviceId || specialist.serviceIds.includes(serviceId))
      && (!normalized || `${specialist.name} ${specialist.title} ${specialist.bio}`.toLocaleLowerCase("ru-RU").includes(normalized)),
    );
  }, [query, serviceId, specialists]);

  if (loading) return <SpecialistsSkeleton />;
  if (error) return <EmptyState icon={CircleAlert} title="Специалисты не загрузились" description={error} action={<Button onClick={() => setReload((value) => value + 1)}>Повторить</Button>} />;
  if (!specialists.length) return <EmptyState icon={Users} title="Пока нет доступных специалистов" description="Расписание команды обновляется. Попробуйте позже." />;

  return (
    <div>
      <div className="grid gap-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5 md:grid-cols-2">
        <label className="relative block">
          <span className="sr-only">Найти специалиста</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя или специализация" className="pl-10" />
        </label>
        <label>
          <span className="sr-only">Фильтр по услуге</span>
          <Select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            <option value="">Все услуги</option>
            {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </Select>
        </label>
      </div>
      <p className="mt-6 text-sm text-muted" aria-live="polite">Найдено: <span className="font-bold text-ink">{filtered.length}</span></p>
      {filtered.length ? <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((specialist) => <SpecialistCard key={specialist.id} specialist={specialist} />)}</div> : <div className="mt-4"><EmptyState title="По таким параметрам никого нет" description="Попробуйте другую услугу или измените поисковый запрос." action={<Button variant="outline" onClick={() => { setQuery(""); setServiceId(""); }}>Сбросить фильтры</Button>} /></div>}
    </div>
  );
}

function SpecialistsSkeleton() {
  return <div role="status" aria-label="Загрузка специалистов"><Skeleton className="h-[84px] w-full" /><div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="rounded-2xl border border-line bg-white p-6"><div className="flex gap-4"><Skeleton className="size-20" /><div className="flex-1"><Skeleton className="h-5 w-4/5" /><Skeleton className="mt-3 h-4 w-3/5" /></div></div><Skeleton className="mt-6 h-4 w-full" /><Skeleton className="mt-2 h-4 w-5/6" /><Skeleton className="mt-8 h-11 w-full" /></div>)}</div><span className="sr-only">Загружаем команду…</span></div>;
}
