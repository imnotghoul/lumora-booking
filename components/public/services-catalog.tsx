"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleAlert, Search, Sparkles } from "lucide-react";
import type { ServiceDto } from "@/lib/types";
import { apiRequest } from "@/components/public/api-client";
import { ServiceCard } from "@/components/public/service-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ServicesCatalog() {
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    apiRequest<ServiceDto[]>("/api/services", { signal: controller.signal })
      .then((data) => setServices(data.filter((item) => item.active)))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Не удалось загрузить услуги.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [reload]);

  const categories = useMemo(() => ["Все", ...Array.from(new Set(services.map((service) => service.category)))], [services]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru-RU");
    return services.filter((service) =>
      (category === "Все" || service.category === category)
      && (!normalized || `${service.name} ${service.description}`.toLocaleLowerCase("ru-RU").includes(normalized)),
    );
  }, [services, category, query]);

  if (loading) return <CatalogSkeleton />;
  if (error) {
    return <EmptyState icon={CircleAlert} title="Услуги не загрузились" description={error} action={<Button onClick={() => setReload((value) => value + 1)}>Повторить</Button>} />;
  }
  if (!services.length) {
    return <EmptyState icon={Sparkles} title="Скоро здесь появятся услуги" description="Мы обновляем каталог. Загляните чуть позже." />;
  }

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" role="group" aria-label="Фильтр по категории">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setCategory(item)}
              className={cn("whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors", item === category ? "bg-accent-600 text-white" : "bg-slate-50 text-muted hover:bg-accent-50 hover:text-accent-700")}
              aria-pressed={item === category}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:max-w-xs">
          <span className="sr-only">Найти услугу</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти услугу" className="pl-10" />
        </label>
      </div>
      <p className="mt-6 text-sm text-muted" aria-live="polite">Найдено: <span className="font-bold text-ink">{filtered.length}</span></p>
      {filtered.length ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => <ServiceCard key={service.id} service={service} />)}
        </div>
      ) : (
        <div className="mt-4"><EmptyState title="Ничего не нашлось" description="Измените поисковый запрос или выберите другую категорию." action={<Button variant="outline" onClick={() => { setQuery(""); setCategory("Все"); }}>Сбросить фильтры</Button>} /></div>
      )}
    </div>
  );
}

function CatalogSkeleton() {
  return <div aria-label="Загрузка услуг" role="status"><Skeleton className="h-[84px] w-full" /><div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="rounded-2xl border border-line bg-white p-6"><Skeleton className="size-12" /><Skeleton className="mt-6 h-5 w-2/3" /><Skeleton className="mt-3 h-4 w-full" /><Skeleton className="mt-2 h-4 w-4/5" /><Skeleton className="mt-8 h-11 w-full" /></div>)}</div><span className="sr-only">Загружаем каталог…</span></div>;
}
